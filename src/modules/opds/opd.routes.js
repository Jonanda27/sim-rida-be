const { Router } = require('express');
const opdController = require('./opd.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createOpdSchema, updateOpdSchema } = require('./opd.validation');

const router = Router();

// Semua rute OPD membutuhkan autentikasi
router.use(authenticate);

// List master OPD (bisa diakses semua role terotentikasi)
router.get('/', opdController.getAllOpds);
router.get('/:id', opdController.getOpdById);

// Create & Update OPD (khusus ADMIN_BRIDA)
router.post('/', authorize(['ADMIN_BRIDA']), validate(createOpdSchema), opdController.createOpd);
router.put('/:id', authorize(['ADMIN_BRIDA']), validate(updateOpdSchema), opdController.updateOpd);

module.exports = router;
