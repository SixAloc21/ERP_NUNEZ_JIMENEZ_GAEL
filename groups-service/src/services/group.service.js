const pool = require('../config/db');
const { buildResponse } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

const permissionAliases = {
  'tickets:view': 'ticket:view',
  'tickets:add': 'ticket:add',
  'tickets:edit': 'ticket:edit',
  'tickets:delete': 'ticket:delete',
  'tickets:move': 'ticket:edit:state',
  'tickets:comment': 'ticket:edit:comment',
  'tickets:manage': 'ticket:manage',
};

async function ensureGroupExists(groupId, client = pool) {
  const { rows } = await client.query(
    `
      select
        g.id,
        g.nombre,
        g.descripcion,
        g.creador_id,
        g.creado_en,
        u.username as creador_username,
        u.email as creador_email,
        u.nombre_completo as creador_nombre_completo
      from grupos
      g
      inner join usuarios u on u.id = g.creador_id
      where g.id = $1
      limit 1;
    `,
    [groupId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExGR404', 'Grupo no encontrado');
  }

  return rows[0];
}

async function ensureUserExists(userId, client = pool) {
  const { rows } = await client.query(
    `
      select id, username, email, nombre_completo
      from usuarios
      where id = $1
      limit 1;
    `,
    [userId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExGM404', 'Usuario no encontrado');
  }

  return rows[0];
}

async function resolvePermissionIds(permissions, client = pool) {
  if (!permissions?.length) {
    return [];
  }

  const normalizedPermissions = permissions.map(
    permission => permissionAliases[permission] || permission
  );

  const { rows } = await client.query(
    `
      select id, nombre
      from permisos
      where nombre = any($1::text[]);
    `,
    [normalizedPermissions]
  );

  const foundNames = new Set(rows.map(row => row.nombre));
  const missing = normalizedPermissions.filter(permission => !foundNames.has(permission));

  if (missing.length) {
    throw new AppError(400, 'ExGP400', 'Hay permisos inexistentes', {
      missing,
    });
  }

  return rows;
}

async function listGroups(filters = {}) {
  const values = [];
  let memberFilter = '';

  if (filters.memberUserId) {
    values.push(filters.memberUserId);
    memberFilter = 'where exists (select 1 from grupo_miembros gm_filter where gm_filter.grupo_id = g.id and gm_filter.usuario_id = $1)';
  }

  const { rows } = await pool.query(`
    select
      g.id,
      g.nombre,
      g.descripcion,
      g.creador_id as "creadorId",
      g.creado_en as "creadoEn",
      u.username as "creadorUsername",
      u.email as "creadorEmail",
      u.nombre_completo as "creadorNombreCompleto",
      count(distinct gm.usuario_id) as "membersCount",
      count(distinct gup.permiso_id) as "assignedPermissionsCount"
    from grupos g
    inner join usuarios u on u.id = g.creador_id
    left join grupo_miembros gm on gm.grupo_id = g.id
    left join grupo_usuario_permisos gup on gup.grupo_id = g.id
    ${memberFilter}
    group by g.id, u.id
    order by g.creado_en desc;
  `, values);

  return buildResponse(200, 'SxGR200', rows);
}

async function getGroupById(groupId) {
  const group = await ensureGroupExists(groupId);

  const members = await listGroupMembersRaw(groupId);

  return buildResponse(200, 'SxGR201', {
    ...mapGroup(group),
    members,
  });
}

async function createGroup(data) {
  const { nombre, descripcion = null, creadorId } = data;

  await ensureUserExists(creadorId);

  const { rows } = await pool.query(
    `
      insert into grupos (
        nombre,
        descripcion,
        creador_id,
        creado_en
      )
      values ($1, $2, $3, now())
      returning
        id,
        nombre,
        descripcion,
        creador_id,
        creado_en;
    `,
    [nombre.trim(), descripcion, creadorId]
  );

  const createdGroup = await ensureGroupExists(rows[0].id);

  return buildResponse(201, 'SxGR202', mapGroup(createdGroup));
}

async function updateGroup(groupId, data) {
  const current = await ensureGroupExists(groupId);

  const payload = {
    nombre: data.nombre ?? current.nombre,
    descripcion: data.descripcion ?? current.descripcion,
  };

  const { rows } = await pool.query(
    `
      update grupos
      set
        nombre = $2,
        descripcion = $3
      where id = $1
      returning
        id,
        nombre,
        descripcion,
        creador_id,
        creado_en;
    `,
    [groupId, payload.nombre, payload.descripcion]
  );

  const updatedGroup = await ensureGroupExists(rows[0].id);

  return buildResponse(200, 'SxGR203', mapGroup(updatedGroup));
}

async function deleteGroup(groupId) {
  const group = await ensureGroupExists(groupId);

  await pool.query(
    `
      delete from grupos
      where id = $1;
    `,
    [groupId]
  );

  return buildResponse(200, 'SxGR204', {
    id: group.id,
    deleted: true,
  });
}

async function listPermissionCatalog() {
  const { rows } = await pool.query(
    `
      select id, nombre
      from permisos
      where
        nombre like 'group:%'
        or nombre like 'ticket:%'
        or nombre like 'user:%'
      order by nombre asc;
    `
  );

  return buildResponse(200, 'SxGP200', rows);
}

async function listGroupMembers(groupId) {
  await ensureGroupExists(groupId);
  const members = await listGroupMembersRaw(groupId);

  return buildResponse(200, 'SxGM200', members);
}

async function listGroupMembersRaw(groupId, client = pool) {
  const { rows } = await client.query(
    `
      select
        gm.grupo_id as "groupId",
        u.id as "userId",
        u.username,
        u.email,
        u.nombre_completo as "fullName",
        gm.fecha_unido as "joinedAt",
        coalesce(
          array_agg(distinct p.nombre) filter (where p.nombre is not null),
          '{}'
        ) as permissions
      from grupo_miembros gm
      inner join usuarios u on u.id = gm.usuario_id
      left join grupo_usuario_permisos gup
        on gup.grupo_id = gm.grupo_id
        and gup.usuario_id = gm.usuario_id
      left join permisos p on p.id = gup.permiso_id
      where gm.grupo_id = $1
      group by gm.grupo_id, u.id, gm.fecha_unido
      order by u.username asc;
    `,
    [groupId]
  );

  return rows;
}

async function addMemberToGroup(groupId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    await ensureGroupExists(groupId, client);
    const user = await ensureUserExists(data.userId, client);

    await client.query(
      `
        insert into grupo_miembros (grupo_id, usuario_id, fecha_unido)
        values ($1, $2, now())
        on conflict (grupo_id, usuario_id) do nothing;
      `,
      [groupId, data.userId]
    );

    const permissionRows = await resolvePermissionIds(data.permissions || [], client);

    if (permissionRows.length) {
      for (const permission of permissionRows) {
        await client.query(
          `
            insert into grupo_usuario_permisos (
              grupo_id,
              usuario_id,
              permiso_id
            )
            values ($1, $2, $3)
            on conflict (grupo_id, usuario_id, permiso_id) do nothing;
          `,
          [groupId, data.userId, permission.id]
        );
      }
    }

    await client.query('commit');

    return buildResponse(201, 'SxGM201', {
      groupId,
      userId: user.id,
      username: user.username,
      permissions: data.permissions || [],
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updateMemberPermissions(groupId, userId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    await ensureGroupExists(groupId, client);
    await ensureUserExists(userId, client);

    const membership = await client.query(
      `
        select 1
        from grupo_miembros
        where grupo_id = $1 and usuario_id = $2
        limit 1;
      `,
      [groupId, userId]
    );

    if (!membership.rows.length) {
      throw new AppError(404, 'ExGM404', 'El usuario no pertenece al grupo');
    }

    const permissionRows = await resolvePermissionIds(data.permissions, client);

    await client.query(
      `
        delete from grupo_usuario_permisos
        where grupo_id = $1 and usuario_id = $2;
      `,
      [groupId, userId]
    );

    for (const permission of permissionRows) {
      await client.query(
        `
          insert into grupo_usuario_permisos (
            grupo_id,
            usuario_id,
            permiso_id
          )
          values ($1, $2, $3);
        `,
        [groupId, userId, permission.id]
      );
    }

    await client.query('commit');

    return buildResponse(200, 'SxGP201', {
      groupId,
      userId,
      permissions: data.permissions,
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function removeMemberFromGroup(groupId, userId) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    await ensureGroupExists(groupId, client);

    await client.query(
      `
        delete from grupo_usuario_permisos
        where grupo_id = $1 and usuario_id = $2;
      `,
      [groupId, userId]
    );

    const result = await client.query(
      `
        delete from grupo_miembros
        where grupo_id = $1 and usuario_id = $2;
      `,
      [groupId, userId]
    );

    if (!result.rowCount) {
      throw new AppError(404, 'ExGM404', 'El usuario no pertenece al grupo');
    }

    await client.query('commit');

    return buildResponse(200, 'SxGM204', {
      groupId,
      userId,
      deleted: true,
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

function mapGroup(group) {
  return {
    id: group.id,
    nombre: group.nombre,
    descripcion: group.descripcion,
    creadorId: group.creador_id ?? group.creadorId ?? null,
    creadoEn: group.creado_en ?? group.creadoEn,
    creador: {
      username: group.creador_username ?? group.creadorUsername ?? null,
      email: group.creador_email ?? group.creadorEmail ?? null,
      nombreCompleto:
        group.creador_nombre_completo ?? group.creadorNombreCompleto ?? null,
    },
  };
}

module.exports = {
  listGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  listPermissionCatalog,
  listGroupMembers,
  addMemberToGroup,
  updateMemberPermissions,
  removeMemberFromGroup,
};
