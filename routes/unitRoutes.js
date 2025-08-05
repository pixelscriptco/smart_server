const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const auth = require('../middleware/auth');

// Get all units
router.get('/', auth, unitController.getAllUnits);
router.get('/enquiries', auth, unitController.getEnquiries);
router.get('/unitplans', auth, unitController.getAllUnitPlans);

// Get unit by ID
router.get('/:id', auth, unitController.getUnitById);

// Create new unit
router.post('/', auth, unitController.createUnit);

// Update unit
router.put('/:id', auth, unitController.updateUnit);

router.put('/:unit_id/status', auth, unitController.updateStatus);

// Delete unit
router.delete('/:id', auth, unitController.deleteUnit);

// Create new unit
router.post('/unitplan', auth, unitController.createUnitPlan);

router.post('/upload-3d-image', auth, unitController.uploadBalcony3dImage);

module.exports = router; 