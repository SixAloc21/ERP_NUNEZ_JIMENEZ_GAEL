const Fastify = require('fastify');
const cors = require('@fastify/cors');

const { buildResponse } = require('./utils/apiResponse');
const { proxyRequest } = require('./utils/proxy');
const { authorizeRequest } = require('./services/access.service');
const { userServiceUrl, groupsServiceUrl, ticketsServiceUrl } = require('./config/services');
const { createRateLimiter } = require('./middlewares/rateLimiter');

function registerProxyRoutes(app, { prefix, targetBaseUrl, serviceName, isPublic = false }) {
  const handler = async (request, reply) => {
    if (!isPublic) {
      await authorizeRequest(serviceName, request);
    }

    return proxyRequest(request, reply, targetBaseUrl);
  };

  app.route({
    method: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    url: prefix,
    handler,
  });

  app.route({
    method: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    url: `${prefix}/*`,
    handler,
  });
}

async function getHealthSnapshot() {
  const services = [
    { name: 'user-service', url: `${userServiceUrl}/` },
    { name: 'groups-service', url: `${groupsServiceUrl}/health` },
    { name: 'tickets-service', url: `${ticketsServiceUrl}/health` },
  ];

  const results = await Promise.all(
    services.map(async service => {
      try {
        const response = await fetch(service.url);
        const payload = await response.json();

        return {
          name: service.name,
          ok: response.ok,
          statusCode: response.status,
          data: payload?.data || null,
        };
      } catch (error) {
        return {
          name: service.name,
          ok: false,
          statusCode: 503,
          data: {
            message: 'Servicio no disponible',
          },
        };
      }
    })
  );

  return results;
}

function buildApp() {
  const app = Fastify({
    logger: false,
  });

  app.register(cors, {
    origin: true,
  });

  app.addHook('onRequest', createRateLimiter());

  app.get('/', async () =>
    buildResponse(200, 'SxGW000', {
      service: 'api-gateway',
      message: 'API Gateway running',
    })
  );

  app.get('/health', async (request, reply) => {
    const downstream = await getHealthSnapshot();
    const hasFailures = downstream.some(service => !service.ok);

    return reply.code(hasFailures ? 503 : 200).send(
      buildResponse(hasFailures ? 503 : 200, hasFailures ? 'ExGW503' : 'SxGW001', {
        status: hasFailures ? 'degraded' : 'ok',
        services: downstream,
      })
    );
  });

  registerProxyRoutes(app, {
    prefix: '/api/auth',
    targetBaseUrl: `${userServiceUrl}/api/auth`,
    serviceName: 'auth',
    isPublic: true,
  });

  registerProxyRoutes(app, {
    prefix: '/api/users',
    targetBaseUrl: `${userServiceUrl}/api/users`,
    serviceName: 'users',
  });

  registerProxyRoutes(app, {
    prefix: '/api/groups',
    targetBaseUrl: `${groupsServiceUrl}/api/groups`,
    serviceName: 'groups',
  });

  registerProxyRoutes(app, {
    prefix: '/api/tickets',
    targetBaseUrl: `${ticketsServiceUrl}/api/tickets`,
    serviceName: 'tickets',
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(
      buildResponse(404, 'ExGW404', {
        message: 'Endpoint no encontrado',
        path: request.raw.url,
      })
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const intOpCode = error.intOpCode || 'ExGW500';

    reply.code(statusCode).send(
      buildResponse(statusCode, intOpCode, {
        message: error.message || 'Error interno del servidor',
        details: error.details || null,
      })
    );
  });

  return app;
}

module.exports = buildApp;
