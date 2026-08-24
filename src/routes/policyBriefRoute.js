const express = require('express');
const { create, getByProblemId } = require('../controllers/policyBriefController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validate');
const { createPolicyBriefSchema } = require('../validations/policyBriefValidation');

const router = express.Router();

router.post('/:problemId', protect, authorize(...["BRIDA","KEPALA_BRIDA"]), upload.array('attachments', 5), validate(createPolicyBriefSchema), create);
router.get('/:problemId', protect, getByProblemId);

module.exports = router;
