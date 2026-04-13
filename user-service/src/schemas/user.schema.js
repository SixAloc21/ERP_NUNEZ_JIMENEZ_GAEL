const createUserSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['nombre_completo', 'username', 'email', 'password'],
  properties: {
    nombre_completo: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    direccion: {
      type: 'string',
      maxLength: 500,
    },
    telefono: {
      type: 'string',
      maxLength: 20,
    },
    fecha_inicio: {
      type: 'string',
      format: 'date',
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50,
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 255,
    },
    activo: {
      type: 'boolean',
    },
  },
};

const updateUserSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    nombre_completo: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    direccion: {
      type: 'string',
      maxLength: 500,
    },
    telefono: {
      type: 'string',
      maxLength: 20,
    },
    fecha_inicio: {
      type: 'string',
      format: 'date',
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50,
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 255,
    },
    activo: {
      type: 'boolean',
    },
  },
};

const updateCurrentUserSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    nombre_completo: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    direccion: {
      type: 'string',
      maxLength: 500,
    },
    telefono: {
      type: 'string',
      maxLength: 20,
    },
    fecha_inicio: {
      type: 'string',
      format: 'date',
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50,
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 255,
    },
  },
};

const updateGlobalPermissionsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['permissions'],
  properties: {
    permissions: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      uniqueItems: true,
    },
  },
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateCurrentUserSchema,
  updateGlobalPermissionsSchema,
};
