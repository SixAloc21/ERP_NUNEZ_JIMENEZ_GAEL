const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      new AppError(401, 'ExUS401', 'Token de autenticación requerido')
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (error) {
    return next(new AppError(401, 'ExUS401', 'Token inválido o expirado'));
  }
}

module.exports = authenticate;
