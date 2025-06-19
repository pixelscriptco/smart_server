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

// Get tower amenities
router.get('/:id/amenities', towerController.getTowerAmenities);

// Create tower amenity
router.post('/:id/amenities', towerController.createTowerAmenity);

// Update tower amenity
router.put('/:id/amenities/:amenityId', towerController.updateTowerAmenity);

// Delete tower amenity
router.delete('/amenities/:amenityId', towerController.deleteTowerAmenity);

router.get('/:id/floors', towerController.getAllFloors);

router.post('/:id/floorplans', towerController.addFloorPlan);

module.exports = router; 