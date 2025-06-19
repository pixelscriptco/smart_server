const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.post('/', auth, buildingController.createBuilding);

// Floorplan routes
router.post('/:building_id', auth, buildingController.saveFloorplan);
router.get('/:project_id', auth, buildingController.getBuildings);
router.get('/:building_id/towers', auth, buildingController.getTowers);
router.delete('/:building_id/floorplan', auth, buildingController.deleteFloorplan);

module.exports = router; 