const express = require('express');

const validateSchema = require('../middlewares/validateSchema');
const {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateMemberPermissionsSchema,
} = require('../schemas/group.schema');
const {
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
} = require('../controllers/group.controller');

const router = express.Router();

router.get('/permissions/catalog', getPermissionCatalog);

router.get('/', getAll);
router.get('/:groupId', getOne);
router.post('/', validateSchema(createGroupSchema), create);
router.patch('/:groupId', validateSchema(updateGroupSchema), update);
router.delete('/:groupId', remove);

router.get('/:groupId/members', getMembers);
router.post('/:groupId/members', validateSchema(addMemberSchema), addMember);
router.patch(
  '/:groupId/members/:userId/permissions',
  validateSchema(updateMemberPermissionsSchema),
  patchMemberPermissions
);
router.delete('/:groupId/members/:userId', removeMember);

module.exports = router;
