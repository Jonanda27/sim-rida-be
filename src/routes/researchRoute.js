const express = require('express');
const { create, getAll, getById } = require('../controllers/researchController');
const validate = require('../middlewares/validate');
const { createResearchSchema } = require('../validations/researchValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('OPD'), validate(createResearchSchema), create)
  .get(protect, authorize('OPD', 'BRIDA'), getAll);

router.route('/:id')
  .get(protect, authorize('OPD', 'BRIDA'), getById);

module.exports = router;
