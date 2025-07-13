const express = require('express');
const router = express.Router();
const towerController = require('../controllers/towerController');

// Get all towers
// router.get('/:project_id', towerController.getAllTowers);

// Get tower by ID
router.get('/:id', towerController.getTowerById);

// Create new tower
router.post('/', towerController.createTower);

// Update tower
router.put('/:id', towerController.updateTower);

// Delete tower
router.delete('/:id', towerController.deleteTower);

router.get('/:id/floors', towerController.getAllFloors);

router.post('/:id/floorplans', towerController.addFloorPlan);

module.exports = router; 