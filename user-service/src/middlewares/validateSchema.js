const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const AppError = require('../utils/appError');

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

    return next(
      new AppError(400, 'ExUS400', 'Datos inválidos', validate.errors || [])
    );
  };
}

module.exports = validateSchema;
