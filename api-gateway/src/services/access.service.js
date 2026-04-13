const jwt = require('jsonwebtoken');

const pool = require('../config/db');
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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function getAuthPayload(authorizationHeader) {
  const [scheme, token] = String(authorizationHeader || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'ExGW401', 'Token de autenticación requerido');
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError(500, 'ExGW500', 'JWT_SECRET no está configurado');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError(401, 'ExGW401', 'Token inválido o expirado');
  }
}

async function resolveTicketGroupId(ticketId) {
  const { rows } = await pool.query(
    `
      select grupo_id as "groupId"
      from tickets
      where id = $1
      limit 1;
    `,
    [ticketId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ExGW404', 'Ticket no encontrado');
  }

  return rows[0].groupId;
}

async function resolveGroupId(serviceName, request) {
  if (serviceName === 'groups') {
    const wildcard = request.params?.['*'] || '';
    const [groupIdFromWildcard] = wildcard.split('/');
    const candidateGroupId = request.params?.groupId || groupIdFromWildcard;

    return isUuid(candidateGroupId) ? candidateGroupId : null;
  }

  if (serviceName !== 'tickets') {
    return null;
  }

  return (
    request.query?.groupId ||
    request.body?.groupId ||
    (request.params?.ticketId ? resolveTicketGroupId(request.params.ticketId) : null)
  );
}

async function getMergedPermissions(userId, groupId = null) {
  const values = [userId];
  let groupFilter = '';

  if (groupId) {
    values.push(groupId);
    groupFilter = 'and gup.grupo_id = $2';
  }

  const { rows } = await pool.query(
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
        where gup.usuario_id = $1
        ${groupFilter}
      ) permisos_unificados
      order by nombre asc;
    `,
    values
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

function getUsersRequiredPermissions(method, wildcard = '') {
  if (wildcard === 'me' && method === 'PATCH') {
    return ['user:edit:profile', 'user:manage'];
  }

  if (wildcard === 'me') {
    return [];
  }

  if (wildcard === 'global-permissions/catalog') {
    return ['user:view', 'user:manage'];
  }

  if (wildcard.endsWith('/global-permissions') && method === 'PATCH') {
    return ['user:manage'];
  }

  if (method === 'GET') {
    return ['user:view', 'user:manage'];
  }

  if (method === 'POST') {
    return ['user:add', 'user:manage'];
  }

  if (method === 'PATCH') {
    return ['user:edit', 'user:manage'];
  }

  if (method === 'DELETE') {
    return ['user:delete', 'user:manage'];
  }

  return [];
}

function getGroupsRequiredPermissions(method) {
  if (method === 'GET') {
    return ['group:view', 'group:manage'];
  }

  if (method === 'POST') {
    return ['group:add', 'group:manage'];
  }

  if (method === 'PATCH') {
    return ['group:edit', 'group:manage'];
  }

  if (method === 'DELETE') {
    return ['group:delete', 'group:manage'];
  }

  return [];
}

function getTicketsRequiredPermissions(method, wildcard = '') {
  if (wildcard === 'catalogs/statuses' || wildcard === 'catalogs/priorities' || wildcard === 'stats') {
    return ['tickets:view', 'tickets:manage'];
  }

  if (wildcard.endsWith('/comments')) {
    return method === 'POST'
      ? ['tickets:comment', 'tickets:manage']
      : ['tickets:view', 'tickets:manage'];
  }

  if (wildcard.endsWith('/history')) {
    return ['tickets:view', 'tickets:manage'];
  }

  if (wildcard.endsWith('/status')) {
    return ['tickets:move', 'tickets:manage'];
  }

  if (wildcard.endsWith('/assignment')) {
    return ['tickets:manage', 'group:manage'];
  }

  if (method === 'GET') {
    return ['tickets:view', 'tickets:manage'];
  }

  if (method === 'POST') {
    return ['tickets:add', 'tickets:manage'];
  }

  if (method === 'PATCH') {
    return ['tickets:edit', 'tickets:manage'];
  }

  if (method === 'DELETE') {
    return ['tickets:delete', 'tickets:manage'];
  }

  return [];
}

async function authorizeRequest(serviceName, request) {
  const auth = getAuthPayload(request.headers.authorization);
  request.auth = auth;

  const wildcard = request.params?.['*'] || '';
  const method = request.method.toUpperCase();

  let requiredPermissions = [];

  if (serviceName === 'users') {
    requiredPermissions = getUsersRequiredPermissions(method, wildcard);
  } else if (serviceName === 'groups') {
    requiredPermissions = getGroupsRequiredPermissions(method);
  } else if (serviceName === 'tickets') {
    requiredPermissions = getTicketsRequiredPermissions(method, wildcard);
  }

  if (!requiredPermissions.length) {
    return auth;
  }

  const groupId = await resolveGroupId(serviceName, request);
  const userPermissions = await getMergedPermissions(auth.id, groupId || null);
  const hasRequiredPermission = requiredPermissions.some(permission =>
    userPermissions.includes(permission)
  );

  if (!hasRequiredPermission) {
    throw new AppError(
      403,
      'ExGW403',
      'No tienes permisos para realizar esta acción',
      {
        requiredAnyOf: requiredPermissions,
      }
    );
  }

  return auth;
}

module.exports = {
  getAuthPayload,
  authorizeRequest,
};
