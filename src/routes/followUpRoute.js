const express = require('express');
const { create, getByProblemId } = require('../controllers/followUpController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validate');
const { createFollowUpSchema } = require('../validations/followUpValidation');

const router = express.Router();

router.post('/:problemId', protect, authorize(...["OPD","BRIDA"]), upload.array('attachments', 5), validate(createFollowUpSchema), create);
router.get('/:problemId', protect, getByProblemId);

module.exports = router;
