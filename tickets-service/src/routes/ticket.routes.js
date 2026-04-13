const {
  listTicketsQuerySchema,
  ticketStatsQuerySchema,
  ticketParamsSchema,
  createTicketSchema,
  updateTicketSchema,
  updateStatusSchema,
  updateAssignmentSchema,
  createCommentSchema,
} = require('../schemas/ticket.schema');
const {
  getAllTickets,
  getTicket,
  createNewTicket,
  patchTicket,
  patchTicketStatus,
  patchTicketAssignment,
  removeTicket,
  getStatuses,
  getPriorities,
  getStats,
  getComments,
  addComment,
  getHistory,
} = require('../controllers/ticket.controller');

async function ticketRoutes(fastify) {
  fastify.get(
    '/',
    {
      schema: {
        querystring: listTicketsQuerySchema,
      },
    },
    getAllTickets
  );

  fastify.get('/catalogs/statuses', getStatuses);
  fastify.get('/catalogs/priorities', getPriorities);
  fastify.get(
    '/stats',
    {
      schema: {
        querystring: ticketStatsQuerySchema,
      },
    },
    getStats
  );

  fastify.get(
    '/:ticketId',
    {
      schema: {
        params: ticketParamsSchema,
      },
    },
    getTicket
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createTicketSchema,
      },
    },
    createNewTicket
  );

  fastify.patch(
    '/:ticketId',
    {
      schema: {
        params: ticketParamsSchema,
        body: updateTicketSchema,
      },
    },
    patchTicket
  );

  fastify.patch(
    '/:ticketId/status',
    {
      schema: {
        params: ticketParamsSchema,
        body: updateStatusSchema,
      },
    },
    patchTicketStatus
  );

  fastify.patch(
    '/:ticketId/assignment',
    {
      schema: {
        params: ticketParamsSchema,
        body: updateAssignmentSchema,
      },
    },
    patchTicketAssignment
  );

  fastify.delete(
    '/:ticketId',
    {
      schema: {
        params: ticketParamsSchema,
      },
    },
    removeTicket
  );

  fastify.get(
    '/:ticketId/comments',
    {
      schema: {
        params: ticketParamsSchema,
      },
    },
    getComments
  );

  fastify.post(
    '/:ticketId/comments',
    {
      schema: {
        params: ticketParamsSchema,
        body: createCommentSchema,
      },
    },
    addComment
  );

  fastify.get(
    '/:ticketId/history',
    {
      schema: {
        params: ticketParamsSchema,
      },
    },
    getHistory
  );
}

module.exports = ticketRoutes;
