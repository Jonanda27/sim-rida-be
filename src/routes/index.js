const express = require('express');
const router = express.Router();

// Import route modules here
const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const problemRoute = require('./problemRoute');
const researchRoute = require('./researchRoute');
const masterRoute = require('./masterRoute');
const reportRoute = require('./reportRoute');
const policyBriefRoute = require('./policyBriefRoute');
const recommendationRoute = require('./recommendationRoute');
const followUpRoute = require('./followUpRoute');

// Define routes
router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/problems', problemRoute);
router.use('/researches', researchRoute);
router.use('/master', masterRoute);
router.use('/reports', reportRoute);
router.use('/policy-briefs', policyBriefRoute);
router.use('/recommendations', recommendationRoute);
router.use('/follow-ups', followUpRoute);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

module.exports = router;
