const permissionNameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 100,
};

const createGroupSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['nombre', 'creadorId'],
  properties: {
    nombre: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    descripcion: {
      type: 'string',
      maxLength: 500,
    },
    creadorId: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
    },
  },
};

const updateGroupSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    nombre: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    descripcion: {
      type: 'string',
      maxLength: 500,
    },
  },
};

const addMemberSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId'],
  properties: {
    userId: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
    },
    assignedBy: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
    },
    permissions: {
      type: 'array',
      items: permissionNameSchema,
      uniqueItems: true,
      default: [],
    },
  },
};

const updateMemberPermissionsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['permissions'],
  properties: {
    permissions: {
      type: 'array',
      items: permissionNameSchema,
      uniqueItems: true,
    },
    assignedBy: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
    },
  },
};

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateMemberPermissionsSchema,
};
