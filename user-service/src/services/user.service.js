const bcrypt = require('bcrypt');
const pool = require('../config/db');
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

const userProjection = `
  select
    u.id,
    u.nombre_completo,
    u.direccion,
    u.telefono,
    u.fecha_inicio,
    u.last_login,
    u.username,
    u.email,
    u.activo,
    u.creado_en,
    u.actualizado_en,
    coalesce(array_agg(distinct p.nombre) filter (where p.nombre is not null), '{}') as permisos
  from usuarios u
  left join unnest(coalesce(u.permisos_globales, '{}'::uuid[])) as permiso_uuid on true
  left join permisos p on p.id = permiso_uuid
`;

async function listUsers() {
  const { rows } = await pool.query(`
    ${userProjection}
    group by u.id
    order by u.creado_en desc;
  `);

  return rows;
}

async function getUserById(userId) {
  const { rows } = await pool.query(
    `
      ${userProjection}
      where u.id = $1
      group by u.id
      limit 1;
    `,
    [userId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExUS404', 'Usuario no encontrado');
  }

  return rows[0];
}

async function getCurrentUser(authUserId) {
  return getUserById(authUserId);
}

async function createUser(data) {
  const {
    nombre_completo,
    direccion,
    telefono,
    fecha_inicio,
    username,
    email,
    password,
  } = data;

  const existsQuery = `
    select id
    from usuarios
    where username = $1 or email = $2
    limit 1;
  `;

  const existsResult = await pool.query(existsQuery, [username, email]);

  if (existsResult.rows.length > 0) {
    throw new AppError(409, 'ExUS409', 'El usuario o correo ya existe');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const insertQuery = `
    insert into usuarios (
      nombre_completo,
      direccion,
      telefono,
      fecha_inicio,
      username,
      email,
      password_hash,
      activo,
      creado_en,
      actualizado_en
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
    returning id;
  `;

  const { rows } = await pool.query(insertQuery, [
    nombre_completo,
    direccion,
    telefono,
    fecha_inicio,
    username,
    email,
    password_hash,
    data.activo ?? true,
  ]);

  return getUserById(rows[0].id);
}

async function updateUser(userId, data) {
  const current = await getUserById(userId);

  const nextUsername = data.username ?? current.username;
  const nextEmail = data.email ?? current.email;

  const duplicated = await pool.query(
    `
      select id
      from usuarios
      where (username = $1 or email = $2)
        and id <> $3
      limit 1;
    `,
    [nextUsername, nextEmail, userId]
  );

  if (duplicated.rows.length > 0) {
    throw new AppError(409, 'ExUS409', 'El usuario o correo ya existe');
  }

  const password_hash = data.password
    ? await bcrypt.hash(data.password, 10)
    : null;

  await pool.query(
    `
      update usuarios
      set
        nombre_completo = $2,
        direccion = $3,
        telefono = $4,
        fecha_inicio = $5,
        username = $6,
        email = $7,
        activo = $8,
        password_hash = coalesce($9, password_hash),
        actualizado_en = now()
      where id = $1;
    `,
    [
      userId,
      data.nombre_completo ?? current.nombre_completo,
      data.direccion ?? current.direccion,
      data.telefono ?? current.telefono,
      data.fecha_inicio ?? current.fecha_inicio,
      nextUsername,
      nextEmail,
      data.activo ?? current.activo,
      password_hash,
    ]
  );

  return getUserById(userId);
}

async function updateCurrentUser(authUserId, data) {
  return updateUser(authUserId, data);
}

async function updateGlobalPermissions(userId, permissions) {
  await getUserById(userId);

  const permissionIds = await resolvePermissionIds(permissions);

  await pool.query(
    `
      update usuarios
      set
        permisos_globales = $2::uuid[],
        actualizado_en = now()
      where id = $1;
    `,
    [userId, permissionIds]
  );

  return getUserById(userId);
}

async function deleteUser(userId) {
  await getUserById(userId);

  await pool.query(
    `
      update usuarios
      set
        activo = false,
        actualizado_en = now()
      where id = $1;
    `,
    [userId]
  );

  return {
    id: userId,
    deleted: true,
  };
}

async function listPermissionCatalog() {
  const { rows } = await pool.query(`
    select id, nombre, descripcion, creado_en
    from permisos
    order by nombre asc;
  `);

  return rows;
}

async function resolvePermissionIds(permissions) {
  if (!permissions?.length) {
    return [];
  }

  const normalizedPermissions = permissions.map(
    permission => permissionAliases[permission] || permission
  );

  const { rows } = await pool.query(
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
    throw new AppError(400, 'ExUS400', 'Hay permisos inexistentes', { missing });
  }

  return rows.map(row => row.id);
}

module.exports = {
  listUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  updateCurrentUser,
  updateGlobalPermissions,
  deleteUser,
  listPermissionCatalog,
};
