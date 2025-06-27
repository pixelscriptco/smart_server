const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const auth = require('../middleware/auth');

// Get all enquiries
router.get('/', auth, enquiryController.getEnquiries);

// Get enquiry type by ID
router.put('/:id/type', auth, enquiryController.updateEnquiryType);

module.exports = router; 