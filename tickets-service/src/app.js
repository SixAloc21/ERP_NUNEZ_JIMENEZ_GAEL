const Fastify = require('fastify');
const cors = require('@fastify/cors');

const ticketRoutes = require('./routes/ticket.routes');
const { buildResponse } = require('./utils/apiResponse');

function buildApp() {
  const app = Fastify({
    logger: false,
  });

  app.register(cors, {
    origin: true,
  });

  app.get('/', async () =>
    buildResponse(200, 'SxTK000', {
      service: 'tickets-service',
      message: 'Tickets service running',
    })
  );

  app.get('/health', async () =>
    buildResponse(200, 'SxTK001', {
      status: 'ok',
    })
  );

  app.register(ticketRoutes, {
    prefix: '/api/tickets',
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(
      buildResponse(404, 'ExTK404', {
        message: 'Endpoint no encontrado',
        path: request.raw.url,
      })
    );
  });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.code(400).send(
        buildResponse(400, 'ExTK400', {
          message: 'Solicitud invalida',
          details: error.validation,
        })
      );
      return;
    }

    const statusCode = error.statusCode || 500;
    const intOpCode = error.intOpCode || 'ExTK500';

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
