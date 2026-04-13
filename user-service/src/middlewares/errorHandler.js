const { buildResponse } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  res.status(404).json(
    buildResponse(404, 'ExUS404', {
      message: 'Endpoint no encontrado',
      path: req.originalUrl,
    })
  );
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const intOpCode = error.intOpCode || 'ExUS500';

  res.status(statusCode).json(
    buildResponse(statusCode, intOpCode, {
      message: error.message || 'Error interno del servidor',
      details: error.details || null,
    })
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
