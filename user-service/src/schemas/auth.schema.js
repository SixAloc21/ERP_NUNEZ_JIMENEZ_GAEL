const loginSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['user', 'password'],
  properties: {
    user: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
  },
};

const registerSchema = {
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
  },
};

module.exports = {
  loginSchema,
  registerSchema,
};
