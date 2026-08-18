const express = require('express');
const { create, getAll, validateStatus, getById, update } = require('../controllers/problemController');
const validate = require('../middlewares/validate');
const { createProblemSchema, validateProblemSchema, updateProblemSchema } = require('../validations/problemValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('OPD'), upload.array('attachments', 5), validate(createProblemSchema), create)
  .get(protect, authorize('OPD', 'BRIDA'), getAll);

router.route('/:id')
  .get(protect, authorize('OPD', 'BRIDA'), getById)
  .patch(protect, authorize('OPD'), upload.array('attachments', 5), validate(updateProblemSchema), update);

router.route('/:id/validate')
  .patch(protect, authorize('BRIDA'), validate(validateProblemSchema), validateStatus);

module.exports = router;
