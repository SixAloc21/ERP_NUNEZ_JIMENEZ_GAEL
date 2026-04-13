const {
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
} = require('../services/ticket.service');

async function getAllTickets(request, reply) {
  const data = await listTickets(request.query);
  reply.code(200).send(data);
}

async function getTicket(request, reply) {
  const data = await getTicketById(request.params.ticketId);
  reply.code(200).send(data);
}

async function createNewTicket(request, reply) {
  const data = await createTicket(request.body);
  reply.code(201).send(data);
}

async function patchTicket(request, reply) {
  const data = await updateTicket(request.params.ticketId, request.body);
  reply.code(200).send(data);
}

async function patchTicketStatus(request, reply) {
  const data = await updateTicketStatus(request.params.ticketId, request.body);
  reply.code(200).send(data);
}

async function patchTicketAssignment(request, reply) {
  const data = await updateTicketAssignment(request.params.ticketId, request.body);
  reply.code(200).send(data);
}

async function removeTicket(request, reply) {
  const data = await deleteTicket(request.params.ticketId);
  reply.code(200).send(data);
}

async function getStatuses(request, reply) {
  const data = await listStatuses();
  reply.code(200).send(data);
}

async function getPriorities(request, reply) {
  const data = await listPriorities();
  reply.code(200).send(data);
}

async function getStats(request, reply) {
  const data = await getTicketStats(request.query);
  reply.code(200).send(data);
}

async function getComments(request, reply) {
  const data = await listTicketComments(request.params.ticketId);
  reply.code(200).send(data);
}

async function addComment(request, reply) {
  const data = await createTicketComment(request.params.ticketId, request.body);
  reply.code(201).send(data);
}

async function getHistory(request, reply) {
  const data = await listTicketHistory(request.params.ticketId);
  reply.code(200).send(data);
}

module.exports = {
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
};
