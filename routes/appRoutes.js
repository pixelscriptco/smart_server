const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// Get dashboard statistics
router.get('/project/:slug', appController.getProjectBySlug);
router.get('/building/:slug', appController.getBuildingBySlug);
router.get('/:build_id/tower/:slug', appController.getTowerDetails);
router.get('/inventories', appController.getInventories);
router.get('/tower/:slug/:tower_name', appController.getTowerBySlug);
router.get('/amenities/:slug/:tower_name', appController.getAmenitiesByTower);
router.get('/tower/:tower_id/floor/:floor_id', appController.getFloorDetails);
router.get('/floor/:slug/:tower_name/:floor_name', appController.getFloorBySlug);
router.get('/unit/:slug/:tower_name/:floor_name/:unit_name', appController.getUnitBySlug);

router.post('/unit/:project_name/book', appController.bookUnit);
// router.get('/:building', appController.getBuildingBySlug);

module.exports = router; 