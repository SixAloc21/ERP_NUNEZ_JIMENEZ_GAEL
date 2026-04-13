const express = require('express');
const router = express.Router();

const validateSchema = require('../middlewares/validateSchema');
const authenticate = require('../middlewares/authenticate');
const {
  createUserSchema,
  updateUserSchema,
  updateCurrentUserSchema,
  updateGlobalPermissionsSchema,
} = require('../schemas/user.schema');
const {
  getAll,
  getOne,
  getMe,
  create,
  patch,
  patchMe,
  patchGlobalPermissions,
  remove,
  getPermissionCatalog,
} = require('../controllers/user.controller');

router.get('/global-permissions/catalog', getPermissionCatalog);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validateSchema(updateCurrentUserSchema), patchMe);

router.get('/', getAll);
router.get('/:userId', getOne);
router.post('/', validateSchema(createUserSchema), create);
router.patch('/:userId', validateSchema(updateUserSchema), patch);
router.patch(
  '/:userId/global-permissions',
  validateSchema(updateGlobalPermissionsSchema),
  patchGlobalPermissions
);
router.delete('/:userId', remove);

module.exports = router;
