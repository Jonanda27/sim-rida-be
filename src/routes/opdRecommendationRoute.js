const express = require('express');
const router = express.Router();
const researchRecommendationController = require('../controllers/researchRecommendationController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// OPD routes: require authentication and role OPD
router.use(requireAuth);
router.use(requireRole('OPD'));

// List published recommendations for this OPD
router.get('/', researchRecommendationController.getOpdRecommendations);

// Detail published recommendation for this OPD
router.get('/:id', researchRecommendationController.getOpdRecommendationById);

module.exports = router;
