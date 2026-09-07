const { Router } = require('express');
const userController = require('./user.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
} = require('./user.validation');

const router = Router();

// Proteksi seluruh route manajemen akun: Wajib login & Hanya boleh diakses ADMIN_BRIDA
router.use(authenticate);
router.use(authorize(['ADMIN_BRIDA']));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(toggleStatusSchema), userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
