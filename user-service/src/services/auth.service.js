const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/appError');

const baseUserSelect = `
  select
    u.id,
    u.nombre_completo,
    u.direccion,
    u.telefono,
    u.fecha_inicio,
    u.last_login,
    u.username,
    u.email,
    u.password_hash,
    u.activo,
    u.creado_en,
    u.actualizado_en,
    coalesce(array_agg(distinct p.nombre) filter (where p.nombre is not null), '{}') as permisos
  from usuarios u
  left join unnest(coalesce(u.permisos_globales, '{}'::uuid[])) as permiso_uuid on true
  left join permisos p on p.id = permiso_uuid
`;

async function loginUser(userOrEmail, password) {
  const query = `
    ${baseUserSelect}
    where (u.email = $1 or u.username = $1)
      and u.activo = true
    group by u.id
    limit 1;
  `;

  const { rows } = await pool.query(query, [userOrEmail]);

  if (rows.length === 0) {
    throw new AppError(404, 'ExUS404', 'Usuario no encontrado');
  }

  const user = rows[0];

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new AppError(400, 'ExUS400', 'Contraseña incorrecta');
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError(500, 'ExUS500', 'JWT_SECRET no está configurado');
  }

  await pool.query(
    `update usuarios set last_login = now() where id = $1`,
    [user.id]
  );

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      permisos: user.permisos,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return {
    user: {
      id: user.id,
      nombre_completo: user.nombre_completo,
      direccion: user.direccion,
      telefono: user.telefono,
      fecha_inicio: user.fecha_inicio,
      username: user.username,
      email: user.email,
      permisos: user.permisos,
      activo: user.activo,
    },
    token,
  };
}

async function registerUser(data) {
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
    values ($1, $2, $3, $4, $5, $6, $7, true, now(), now())
    returning id, nombre_completo, direccion, telefono, fecha_inicio, username, email, activo, creado_en;
  `;

  const { rows } = await pool.query(insertQuery, [
    nombre_completo,
    direccion,
    telefono,
    fecha_inicio,
    username,
    email,
    password_hash,
  ]);

  return {
    ...rows[0],
    permisos: [],
  };
}

module.exports = {
  loginUser,
  registerUser,
};
