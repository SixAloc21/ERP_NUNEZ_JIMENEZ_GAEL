const {
  listUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  updateCurrentUser,
  updateGlobalPermissions,
  deleteUser,
  listPermissionCatalog,
} = require('../services/user.service');
const { buildResponse } = require('../utils/apiResponse');

async function getAll(req, res) {
  try {
    const result = await listUsers();
    return res.status(200).json(buildResponse(200, 'SxUS203', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function getOne(req, res) {
  try {
    const result = await getUserById(req.params.userId);
    return res.status(200).json(buildResponse(200, 'SxUS204', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function getMe(req, res) {
  try {
    const result = await getCurrentUser(req.auth.id);
    return res.status(200).json(buildResponse(200, 'SxUS205', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function create(req, res) {
  try {
    const result = await createUser(req.body);

    return res.status(201).json(buildResponse(201, 'SxUS202', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function patch(req, res) {
  try {
    const result = await updateUser(req.params.userId, req.body);
    return res.status(200).json(buildResponse(200, 'SxUS206', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function patchMe(req, res) {
  try {
    const result = await updateCurrentUser(req.auth.id, req.body);
    return res.status(200).json(buildResponse(200, 'SxUS207', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function patchGlobalPermissions(req, res) {
  try {
    const result = await updateGlobalPermissions(
      req.params.userId,
      req.body.permissions
    );

    return res.status(200).json(buildResponse(200, 'SxUS208', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function remove(req, res) {
  try {
    const result = await deleteUser(req.params.userId);
    return res.status(200).json(buildResponse(200, 'SxUS209', result));
  } catch (error) {
    return handleError(res, error);
  }
}

async function getPermissionCatalog(req, res) {
  try {
    const result = await listPermissionCatalog();
    return res.status(200).json(buildResponse(200, 'SxUS210', result));
  } catch (error) {
    return handleError(res, error);
  }
}

function handleError(res, error) {
  return res.status(error.statusCode || 500).json(
    buildResponse(error.statusCode || 500, error.intOpCode || 'ExUS500', {
      error: error.message,
      details: error.details || null,
    })
  );
}

module.exports = {
  getAll,
  getOne,
  getMe,
  create,
  patch,
  patchMe,
  patchGlobalPermissions,
  remove,
  getPermissionCatalog,
};
