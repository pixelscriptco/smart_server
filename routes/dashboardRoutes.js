const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.get('/states', auth, dashboardController.getStats);

module.exports = router; 