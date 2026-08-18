const express = require('express');
const router = express.Router();

// Import route modules here
const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const problemRoute = require('./problemRoute');
const researchRoute = require('./researchRoute');
const masterRoute = require('./masterRoute');

// Define routes
router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/problems', problemRoute);
router.use('/researches', researchRoute);
router.use('/master', masterRoute);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

module.exports = router;
