const optionalUuid = {
  type: 'string',
  minLength: 1,
  maxLength: 60,
};

const optionalNullableUuid = {
  anyOf: [
    { type: 'string', minLength: 1, maxLength: 60 },
    { type: 'null' },
  ],
};

const optionalNullableText = {
  anyOf: [
    { type: 'string', minLength: 1, maxLength: 5000 },
    { type: 'null' },
  ],
};

const listTicketsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
    },
    sortBy: {
      type: 'string',
      enum: ['id', 'titulo', 'prioridad', 'fecha', 'estado', 'asignado', 'grupo'],
      default: 'fecha',
    },
    sortDir: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
    },
    groupId: optionalUuid,
    assignedUserId: optionalUuid,
    authorId: optionalUuid,
    estadoId: optionalUuid,
    estadoNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    prioridadId: optionalUuid,
    prioridadNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    search: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
    },
  },
};

const ticketStatsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    groupId: optionalUuid,
    assignedUserId: optionalUuid,
    authorId: optionalUuid,
    estadoId: optionalUuid,
    estadoNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    prioridadId: optionalUuid,
    prioridadNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    search: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
    },
  },
};

const ticketParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ticketId'],
  properties: {
    ticketId: optionalUuid,
  },
};

const createTicketSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['groupId', 'titulo', 'autorId'],
  properties: {
    groupId: optionalUuid,
    titulo: {
      type: 'string',
      minLength: 3,
      maxLength: 500,
    },
    descripcion: optionalNullableText,
    autorId: optionalUuid,
    asignadoId: optionalNullableUuid,
    estadoId: optionalUuid,
    estadoNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    prioridadId: optionalUuid,
    prioridadNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    fechaFinal: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
  },
};

const updateTicketSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    titulo: {
      type: 'string',
      minLength: 3,
      maxLength: 500,
    },
    descripcion: optionalNullableText,
    asignadoId: optionalNullableUuid,
    prioridadId: optionalUuid,
    prioridadNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
    fechaFinal: {
      anyOf: [
        { type: 'string', minLength: 1, maxLength: 80 },
        { type: 'null' },
      ],
    },
  },
};

const updateStatusSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['performedByUserId'],
  properties: {
    performedByUserId: optionalUuid,
    estadoId: optionalUuid,
    estadoNombre: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },
  },
};

const updateAssignmentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['performedByUserId'],
  properties: {
    performedByUserId: optionalUuid,
    asignadoId: optionalNullableUuid,
  },
};

const createCommentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['autorId', 'contenido'],
  properties: {
    autorId: optionalUuid,
    contenido: {
      type: 'string',
      minLength: 1,
      maxLength: 5000,
    },
  },
};

module.exports = {
  listTicketsQuerySchema,
  ticketStatsQuerySchema,
  ticketParamsSchema,
  createTicketSchema,
  updateTicketSchema,
  updateStatusSchema,
  updateAssignmentSchema,
  createCommentSchema,
};
