const {
  listGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  listPermissionCatalog,
  listGroupMembers,
  addMemberToGroup,
  updateMemberPermissions,
  removeMemberFromGroup,
} = require('../services/group.service');

async function getAll(req, res, next) {
  try {
    const data = await listGroups({
      memberUserId: req.query.memberUserId,
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const data = await getGroupById(req.params.groupId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await createGroup(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await updateGroup(req.params.groupId, req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await deleteGroup(req.params.groupId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getPermissionCatalog(req, res, next) {
  try {
    const data = await listPermissionCatalog();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getMembers(req, res, next) {
  try {
    const data = await listGroupMembers(req.params.groupId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    const data = await addMemberToGroup(req.params.groupId, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function patchMemberPermissions(req, res, next) {
  try {
    const data = await updateMemberPermissions(
      req.params.groupId,
      req.params.userId,
      req.body
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    const data = await removeMemberFromGroup(
      req.params.groupId,
      req.params.userId
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  getPermissionCatalog,
  getMembers,
  addMember,
  patchMemberPermissions,
  removeMember,
};
