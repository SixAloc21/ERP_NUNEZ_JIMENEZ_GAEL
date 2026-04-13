const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false,
});

addFormats(ajv);

function validateSchema(schema) {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const isValid = validate(req.body);

    if (isValid) {
      return next();
    }

    const error = new Error('Datos inválidos');
    error.statusCode = 400;
    error.intOpCode = 'ExGR400';
    error.details = validate.errors || [];

    return next(error);
  };
}

module.exports = validateSchema;
