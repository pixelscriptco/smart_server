const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');
const auth = require('../middleware/auth');

// Get all floors
router.get('/', auth, floorController.getAllFloors);

// Get floor by ID
router.get('/:id', auth, floorController.getFloorById);

// Create new floor
router.post('/', auth, floorController.createFloor);

// Create new floor plan
router.post('/floorplan', auth, floorController.saveFloorPlan);

// Update floor
router.put('/:id', auth, floorController.updateFloor);

// Delete floor
router.delete('/:id', auth, floorController.deleteFloor);

router.get('/:project_id/floorplans', auth, floorController.getAllFloorPlans);

router.get('/:floor_id/plan', auth, floorController.getFloorPlan);

router.get('/:floor_id/units', auth, floorController.getUnits);

router.post('/units/map-plan', auth, floorController.mapFloorUnit);

module.exports = router; 