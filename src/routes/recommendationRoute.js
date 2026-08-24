const express = require('express');
const { create, getByProblemId } = require('../controllers/recommendationController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validate');
const { createRecommendationSchema } = require('../validations/recommendationValidation');

const router = express.Router();

router.post('/:problemId', protect, authorize(...["KEPALA_BRIDA"]), upload.array('attachments', 5), validate(createRecommendationSchema), create);
router.get('/:problemId', protect, getByProblemId);

module.exports = router;
