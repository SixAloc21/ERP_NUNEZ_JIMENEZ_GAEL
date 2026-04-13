const { loginUser, registerUser } = require('../services/auth.service');
const { buildResponse } = require('../utils/apiResponse');

async function login(req, res) {
  try {
    const { user, password } = req.body;

    const result = await loginUser(user, password);

    return res.status(200).json(buildResponse(200, 'SxUS200', result));
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      buildResponse(error.statusCode || 500, error.intOpCode || 'ExUS500', {
        error: error.message,
        details: error.details || null,
      })
    );
  }
}

async function register(req, res) {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json(buildResponse(201, 'SxUS201', result));
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      buildResponse(error.statusCode || 500, error.intOpCode || 'ExUS500', {
        error: error.message,
        details: error.details || null,
      })
    );
  }
}

module.exports = {
  login,
  register,
};
