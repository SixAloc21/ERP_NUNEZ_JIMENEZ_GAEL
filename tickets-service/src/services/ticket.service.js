const pool = require('../config/db');
const { buildResponse } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

const permissionAliasMap = {
  'ticket:view': 'tickets:view',
  'ticket:add': 'tickets:add',
  'ticket:edit': 'tickets:edit',
  'ticket:delete': 'tickets:delete',
  'ticket:edit:state': 'tickets:move',
  'ticket:edit:comment': 'tickets:comment',
  'ticket:manage': 'tickets:manage',
};

const reversePermissionAliasMap = Object.fromEntries(
  Object.entries(permissionAliasMap).map(([legacy, canonical]) => [canonical, legacy])
);

async function ensureGroupExists(groupId, client = pool) {
  const { rows } = await client.query(
    `
      select id, nombre
      from grupos
      where id = $1
      limit 1;
    `,
    [groupId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExTK404', 'Grupo no encontrado');
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
    throw new AppError(404, 'ExTK404', 'Usuario no encontrado');
  }

  return rows[0];
}

async function ensureGroupMember(groupId, userId, client = pool) {
  const { rows } = await client.query(
    `
      select 1
      from grupo_miembros
      where grupo_id = $1 and usuario_id = $2
      limit 1;
    `,
    [groupId, userId]
  );

  if (!rows.length) {
    throw new AppError(400, 'ExTK400', 'El usuario no pertenece al grupo');
  }
}

async function resolveStatus(data = {}, client = pool, required = false) {
  if (!data.estadoId && !data.estadoNombre) {
    if (required) {
      throw new AppError(400, 'ExTS400', 'Debes enviar un estado');
    }

    return null;
  }

  const query = data.estadoId
    ? `
        select id, nombre, color
        from estados
        where id = $1
        limit 1;
      `
    : `
        select id, nombre, color
        from estados
        where lower(nombre) = lower($1)
        limit 1;
      `;

  const value = data.estadoId || data.estadoNombre;
  const { rows } = await client.query(query, [value]);

  if (!rows.length) {
    throw new AppError(404, 'ExTS404', 'Estado no encontrado');
  }

  return rows[0];
}

async function resolvePriority(data = {}, client = pool, required = false) {
  if (!data.prioridadId && !data.prioridadNombre) {
    if (required) {
      throw new AppError(400, 'ExTP400', 'Debes enviar una prioridad');
    }

    return null;
  }

  const query = data.prioridadId
    ? `
        select id, nombre, orden
        from prioridades
        where id = $1
        limit 1;
      `
    : `
        select id, nombre, orden
        from prioridades
        where lower(nombre) = lower($1)
        limit 1;
      `;

  const value = data.prioridadId || data.prioridadNombre;
  const { rows } = await client.query(query, [value]);

  if (!rows.length) {
    throw new AppError(404, 'ExTP404', 'Prioridad no encontrada');
  }

  return rows[0];
}

async function getUserPermissionNames(userId, groupId, client = pool) {
  const { rows } = await client.query(
    `
      select distinct nombre
      from (
        select p.nombre
        from usuarios u
        left join unnest(coalesce(u.permisos_globales, '{}'::uuid[])) as permiso_uuid on true
        inner join permisos p on p.id = permiso_uuid
        where u.id = $1

        union

        select p.nombre
        from grupo_usuario_permisos gup
        inner join permisos p on p.id = gup.permiso_id
        where gup.usuario_id = $1 and gup.grupo_id = $2
      ) permisos_unificados
      order by nombre asc;
    `,
    [userId, groupId]
  );

  const allPermissions = new Set();

  rows.forEach(row => {
    allPermissions.add(row.nombre);

    const canonical = permissionAliasMap[row.nombre];
    if (canonical) {
      allPermissions.add(canonical);
    }

    const legacy = reversePermissionAliasMap[row.nombre];
    if (legacy) {
      allPermissions.add(legacy);
    }
  });

  return Array.from(allPermissions);
}

async function assertUserHasAnyPermission(
  userId,
  groupId,
  permissions,
  intOpCode,
  message,
  client = pool
) {
  const currentPermissions = await getUserPermissionNames(userId, groupId, client);
  const hasPermission = permissions.some(permission =>
    currentPermissions.includes(permission)
  );

  if (!hasPermission) {
    throw new AppError(403, intOpCode, message, {
      requiredAnyOf: permissions,
    });
  }
}

async function insertHistory(
  client,
  {
    ticketId,
    userId = null,
    action,
    details = null,
  }
) {
  await client.query(
    `
      insert into historial_tickets (
        ticket_id,
        usuario_id,
        accion,
        detalles,
        creado_en
      )
      values ($1, $2, $3, $4::jsonb, now());
    `,
    [ticketId, userId, action, details ? JSON.stringify(details) : null]
  );
}

function normalizeText(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeDate(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isDoneStatus(statusName) {
  return statusName.toLowerCase() === 'realizado';
}

function buildListFilters(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.groupId) {
    values.push(filters.groupId);
    conditions.push(`t.grupo_id = $${values.length}`);
  }

  if (filters.assignedUserId) {
    values.push(filters.assignedUserId);
    conditions.push(`t.asignado_id = $${values.length}`);
  }

  if (filters.authorId) {
    values.push(filters.authorId);
    conditions.push(`t.autor_id = $${values.length}`);
  }

  if (filters.estadoId) {
    values.push(filters.estadoId);
    conditions.push(`t.estado_id = $${values.length}`);
  }

  if (filters.estadoNombre) {
    values.push(filters.estadoNombre);
    conditions.push(`lower(e.nombre) = lower($${values.length})`);
  }

  if (filters.prioridadId) {
    values.push(filters.prioridadId);
    conditions.push(`t.prioridad_id = $${values.length}`);
  }

  if (filters.prioridadNombre) {
    values.push(filters.prioridadNombre);
    conditions.push(`lower(pr.nombre) = lower($${values.length})`);
  }

  if (filters.search) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(t.titulo ilike $${values.length} or coalesce(t.descripcion, '') ilike $${values.length})`
    );
  }

  return {
    values,
    whereClause: conditions.length ? `where ${conditions.join(' and ')}` : '',
  };
}

function buildSortClause(sortBy = 'fecha', sortDir = 'desc') {
  const direction = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const sortableColumns = {
    id: 't.id',
    titulo: 't.titulo',
    prioridad: 'pr.orden',
    fecha: 't.creado_en',
    estado: 'e.nombre',
    asignado: `coalesce(asignado.nombre_completo, asignado.username, '')`,
    grupo: 'g.nombre',
  };

  const sortColumn = sortableColumns[sortBy] || sortableColumns.fecha;
  return `order by ${sortColumn} ${direction}, t.creado_en desc`;
}

async function listTickets(filters = {}) {
  const { values, whereClause } = buildListFilters(filters);
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;
  const sortBy = filters.sortBy || 'fecha';
  const sortDir = filters.sortDir || 'desc';
  const orderByClause = buildSortClause(sortBy, sortDir);

  const totalResult = await pool.query(
    `
      select count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause};
    `,
    values
  );

  const total = totalResult.rows[0]?.total || 0;
  const paginatedValues = [...values, limit, offset];

  const { rows } = await pool.query(
    `
      select
        t.id,
        t.grupo_id as "groupId",
        g.nombre as "groupName",
        t.titulo,
        t.descripcion,
        t.autor_id as "authorId",
        au.username as "authorUsername",
        au.email as "authorEmail",
        au.nombre_completo as "authorFullName",
        t.asignado_id as "assignedId",
        asignado.username as "assignedUsername",
        asignado.email as "assignedEmail",
        asignado.nombre_completo as "assignedFullName",
        t.estado_id as "statusId",
        e.nombre as "statusName",
        e.color as "statusColor",
        t.prioridad_id as "priorityId",
        pr.nombre as "priorityName",
        pr.orden as "priorityOrder",
        t.creado_en as "createdAt",
        t.fecha_final as "fechaFinal",
        count(distinct c.id) as "commentsCount"
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      left join comentarios c on c.ticket_id = t.id
      ${whereClause}
      group by
        t.id,
        g.id,
        au.id,
        asignado.id,
        e.id,
        pr.id
      ${orderByClause}
      limit $${paginatedValues.length - 1}
      offset $${paginatedValues.length};
    `,
    paginatedValues
  );

  return buildResponse(200, 'SxTK200', {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    sorting: {
      sortBy,
      sortDir: String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc',
    },
  });
}

async function ensureTicketExists(ticketId, client = pool) {
  const { rows } = await client.query(
    `
      select
        t.id,
        t.grupo_id as "groupId",
        g.nombre as "groupName",
        t.titulo,
        t.descripcion,
        t.autor_id as "authorId",
        au.username as "authorUsername",
        au.email as "authorEmail",
        au.nombre_completo as "authorFullName",
        t.asignado_id as "assignedId",
        asignado.username as "assignedUsername",
        asignado.email as "assignedEmail",
        asignado.nombre_completo as "assignedFullName",
        t.estado_id as "statusId",
        e.nombre as "statusName",
        e.color as "statusColor",
        t.prioridad_id as "priorityId",
        pr.nombre as "priorityName",
        pr.orden as "priorityOrder",
        t.creado_en as "createdAt",
        t.fecha_final as "fechaFinal"
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      where t.id = $1
      limit 1;
    `,
    [ticketId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExTK404', 'Ticket no encontrado');
  }

  return rows[0];
}

async function listTicketCommentsRaw(ticketId, client = pool) {
  const { rows } = await client.query(
    `
      select
        c.id,
        c.ticket_id as "ticketId",
        c.autor_id as "authorId",
        u.username as "authorUsername",
        u.email as "authorEmail",
        u.nombre_completo as "authorFullName",
        c.contenido,
        c.creado_en as "createdAt"
      from comentarios c
      inner join usuarios u on u.id = c.autor_id
      where c.ticket_id = $1
      order by c.creado_en asc;
    `,
    [ticketId]
  );

  return rows;
}

async function listTicketHistoryRaw(ticketId, client = pool) {
  const { rows } = await client.query(
    `
      select
        h.id,
        h.ticket_id as "ticketId",
        h.usuario_id as "userId",
        u.username,
        u.email,
        u.nombre_completo as "fullName",
        h.accion as action,
        h.detalles as details,
        h.creado_en as "createdAt"
      from historial_tickets h
      left join usuarios u on u.id = h.usuario_id
      where h.ticket_id = $1
      order by h.creado_en asc;
    `,
    [ticketId]
  );

  return rows;
}

async function buildTicketDetail(ticketId, client = pool) {
  const ticket = await ensureTicketExists(ticketId, client);
  const comments = await listTicketCommentsRaw(ticketId, client);
  const history = await listTicketHistoryRaw(ticketId, client);

  return {
    ...ticket,
    comments,
    history,
  };
}

async function getTicketById(ticketId) {
  const detail = await buildTicketDetail(ticketId);
  return buildResponse(200, 'SxTK201', detail);
}

async function createTicket(data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const group = await ensureGroupExists(data.groupId, client);
    const author = await ensureUserExists(data.autorId, client);
    await ensureGroupMember(group.id, author.id, client);

    const status = await resolveStatus(data, client, true);
    const priority = await resolvePriority(data, client, true);

    let assignedId = null;
    if (data.asignadoId) {
      const assignedUser = await ensureUserExists(data.asignadoId, client);
      await ensureGroupMember(group.id, assignedUser.id, client);
      assignedId = assignedUser.id;
    }

    const normalizedFechaFinal = normalizeDate(data.fechaFinal);
    const fechaFinal =
      normalizedFechaFinal !== undefined
        ? normalizedFechaFinal
        : isDoneStatus(status.nombre)
          ? new Date().toISOString()
          : null;

    const { rows } = await client.query(
      `
        insert into tickets (
          grupo_id,
          titulo,
          descripcion,
          autor_id,
          asignado_id,
          estado_id,
          prioridad_id,
          creado_en,
          fecha_final
        )
        values ($1, $2, $3, $4, $5, $6, $7, now(), $8)
        returning id;
      `,
      [
        group.id,
        data.titulo.trim(),
        normalizeText(data.descripcion) ?? null,
        author.id,
        assignedId,
        status.id,
        priority.id,
        fechaFinal,
      ]
    );

    const ticketId = rows[0].id;

    await insertHistory(client, {
      ticketId,
      userId: author.id,
      action: 'CREACION',
      details: {
        mensaje: 'Ticket creado',
        titulo: data.titulo.trim(),
        grupo: group.nombre,
      },
    });

    if (assignedId) {
      await insertHistory(client, {
        ticketId,
        userId: author.id,
        action: 'ASIGNACION',
        details: {
          mensaje: 'Ticket asignado a usuario',
          asignadoId: assignedId,
        },
      });
    }

    await client.query('commit');

    const detail = await buildTicketDetail(ticketId);
    return buildResponse(201, 'SxTK202', detail);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTicket(ticketId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const current = await ensureTicketExists(ticketId, client);
    const priority = data.prioridadId || data.prioridadNombre
      ? await resolvePriority(data, client, true)
      : null;

    let assignedId = current.assignedId;
    if (Object.prototype.hasOwnProperty.call(data, 'asignadoId')) {
      if (data.asignadoId === null) {
        assignedId = null;
      } else {
        const assignedUser = await ensureUserExists(data.asignadoId, client);
        await ensureGroupMember(current.groupId, assignedUser.id, client);
        assignedId = assignedUser.id;
      }
    }

    const normalizedDescription = normalizeText(data.descripcion);
    const normalizedFechaFinal = normalizeDate(data.fechaFinal);

    await client.query(
      `
        update tickets
        set
          titulo = $2,
          descripcion = $3,
          asignado_id = $4,
          prioridad_id = $5,
          fecha_final = $6
        where id = $1;
      `,
      [
        ticketId,
        data.titulo?.trim() || current.titulo,
        normalizedDescription !== undefined ? normalizedDescription : current.descripcion,
        assignedId,
        priority?.id || current.priorityId,
        normalizedFechaFinal !== undefined ? normalizedFechaFinal : current.fechaFinal,
      ]
    );

    await insertHistory(client, {
      ticketId,
      userId: current.authorId,
      action: 'ACTUALIZACION',
      details: {
        mensaje: 'Ticket actualizado',
      },
    });

    if (assignedId !== current.assignedId) {
      await insertHistory(client, {
        ticketId,
        userId: current.authorId,
        action: 'ASIGNACION',
        details: {
          mensaje: assignedId ? 'Ticket reasignado' : 'Asignacion removida',
          anterior: current.assignedId,
          actual: assignedId,
        },
      });
    }

    await client.query('commit');

    const detail = await buildTicketDetail(ticketId);
    return buildResponse(200, 'SxTK203', detail);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTicketStatus(ticketId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const current = await ensureTicketExists(ticketId, client);
    await ensureUserExists(data.performedByUserId, client);

    if (!current.assignedId || current.assignedId !== data.performedByUserId) {
      throw new AppError(
        403,
        'ExTK403',
        'Solo el usuario asignado puede mover el ticket'
      );
    }

    await assertUserHasAnyPermission(
      data.performedByUserId,
      current.groupId,
      ['tickets:move', 'tickets:manage'],
      'ExTK403',
      'El usuario no tiene permisos para cambiar el estado del ticket',
      client
    );

    const nextStatus = await resolveStatus(data, client, true);
    const nextFechaFinal = isDoneStatus(nextStatus.nombre)
      ? new Date().toISOString()
      : current.fechaFinal;

    await client.query(
      `
        update tickets
        set
          estado_id = $2,
          fecha_final = $3
        where id = $1;
      `,
      [ticketId, nextStatus.id, nextFechaFinal]
    );

    await insertHistory(client, {
      ticketId,
      userId: data.performedByUserId,
      action: 'CAMBIO_ESTADO',
      details: {
        mensaje: 'Estado de ticket actualizado',
        anterior: current.statusName,
        actual: nextStatus.nombre,
      },
    });

    await client.query('commit');

    const detail = await buildTicketDetail(ticketId);
    return buildResponse(200, 'SxTK204', detail);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTicketAssignment(ticketId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const current = await ensureTicketExists(ticketId, client);
    await ensureUserExists(data.performedByUserId, client);

    await assertUserHasAnyPermission(
      data.performedByUserId,
      current.groupId,
      ['tickets:manage', 'group:manage'],
      'ExTK403',
      'El usuario no tiene permisos para asignar tickets',
      client
    );

    let assignedId = null;
    if (data.asignadoId) {
      const assignedUser = await ensureUserExists(data.asignadoId, client);
      await ensureGroupMember(current.groupId, assignedUser.id, client);
      assignedId = assignedUser.id;
    }

    await client.query(
      `
        update tickets
        set asignado_id = $2
        where id = $1;
      `,
      [ticketId, assignedId]
    );

    await insertHistory(client, {
      ticketId,
      userId: data.performedByUserId,
      action: 'ASIGNACION',
      details: {
        mensaje: assignedId ? 'Ticket asignado' : 'Asignacion removida',
        anterior: current.assignedId,
        actual: assignedId,
      },
    });

    await client.query('commit');

    const detail = await buildTicketDetail(ticketId);
    return buildResponse(200, 'SxTK205', detail);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTicket(ticketId) {
  await ensureTicketExists(ticketId);

  await pool.query(
    `
      delete from tickets
      where id = $1;
    `,
    [ticketId]
  );

  return buildResponse(200, 'SxTK206', {
    id: ticketId,
    deleted: true,
  });
}

async function listStatuses() {
  const { rows } = await pool.query(
    `
      select id, nombre, color
      from estados
      order by nombre asc;
    `
  );

  return buildResponse(200, 'SxTS200', rows);
}

async function listPriorities() {
  const { rows } = await pool.query(
    `
      select id, nombre, orden
      from prioridades
      order by orden desc, nombre asc;
    `
  );

  return buildResponse(200, 'SxTP200', rows);
}

async function listTicketComments(ticketId) {
  await ensureTicketExists(ticketId);
  const comments = await listTicketCommentsRaw(ticketId);
  return buildResponse(200, 'SxTC200', comments);
}

async function createTicketComment(ticketId, data) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const ticket = await ensureTicketExists(ticketId, client);
    const author = await ensureUserExists(data.autorId, client);
    await ensureGroupMember(ticket.groupId, author.id, client);

    await assertUserHasAnyPermission(
      author.id,
      ticket.groupId,
      ['tickets:comment', 'tickets:manage'],
      'ExTC403',
      'El usuario no tiene permisos para comentar el ticket',
      client
    );

    const { rows } = await client.query(
      `
        insert into comentarios (
          ticket_id,
          autor_id,
          contenido,
          creado_en
        )
        values ($1, $2, $3, now())
        returning id;
      `,
      [ticketId, author.id, data.contenido.trim()]
    );

    await insertHistory(client, {
      ticketId,
      userId: author.id,
      action: 'COMENTARIO',
      details: {
        mensaje: 'Comentario agregado al ticket',
        comentarioId: rows[0].id,
      },
    });

    await client.query('commit');

    const comments = await listTicketCommentsRaw(ticketId);
    const createdComment = comments.find(comment => comment.id === rows[0].id);

    return buildResponse(201, 'SxTC201', createdComment || null);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function listTicketHistory(ticketId) {
  await ensureTicketExists(ticketId);
  const history = await listTicketHistoryRaw(ticketId);
  return buildResponse(200, 'SxTH200', history);
}

async function getTicketStats(filters = {}) {
  const { values, whereClause } = buildListFilters(filters);

  const totalResult = await pool.query(
    `
      select count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause};
    `,
    values
  );

  const byStatusResult = await pool.query(
    `
      select
        e.id,
        e.nombre,
        e.color,
        count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause}
      group by e.id
      order by e.nombre asc;
    `,
    values
  );

  const byPriorityResult = await pool.query(
    `
      select
        pr.id,
        pr.nombre,
        pr.orden,
        count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause}
      group by pr.id
      order by pr.orden desc, pr.nombre asc;
    `,
    values
  );

  const byGroupResult = await pool.query(
    `
      select
        g.id,
        g.nombre,
        count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause}
      group by g.id
      order by g.nombre asc;
    `,
    values
  );

  const byAssignedResult = await pool.query(
    `
      select
        asignado.id,
        coalesce(asignado.nombre_completo, asignado.username, 'Sin asignar') as nombre,
        count(distinct t.id)::int as total
      from tickets t
      inner join grupos g on g.id = t.grupo_id
      inner join usuarios au on au.id = t.autor_id
      left join usuarios asignado on asignado.id = t.asignado_id
      inner join estados e on e.id = t.estado_id
      inner join prioridades pr on pr.id = t.prioridad_id
      ${whereClause}
      group by asignado.id, asignado.nombre_completo, asignado.username
      order by nombre asc;
    `,
    values
  );

  return buildResponse(200, 'SxTK207', {
    summary: {
      total: totalResult.rows[0]?.total || 0,
    },
    byStatus: byStatusResult.rows,
    byPriority: byPriorityResult.rows,
    byGroup: byGroupResult.rows,
    byAssigned: byAssignedResult.rows,
  });
}

module.exports = {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketStatus,
  updateTicketAssignment,
  deleteTicket,
  listStatuses,
  listPriorities,
  getTicketStats,
  listTicketComments,
  createTicketComment,
  listTicketHistory,
};
