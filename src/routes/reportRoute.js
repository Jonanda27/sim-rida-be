const express = require('express');
const { create, getByProblemId } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validate');
const { createReportSchema } = require('../validations/reportValidation');

const router = express.Router();

router.post('/:problemId', protect, authorize(...["OPD","BRIDA"]), upload.array('attachments', 5), validate(createReportSchema), create);
router.get('/:problemId', protect, getByProblemId);

module.exports = router;
