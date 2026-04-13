function ensureServiceUrl(envKey, fallback) {
  return process.env[envKey] || fallback;
}

module.exports = {
  userServiceUrl: ensureServiceUrl('USER_SERVICE_URL', 'http://localhost:3000'),
  groupsServiceUrl: ensureServiceUrl('GROUPS_SERVICE_URL', 'http://localhost:3002'),
  ticketsServiceUrl: ensureServiceUrl('TICKETS_SERVICE_URL', 'http://localhost:3003'),
};
