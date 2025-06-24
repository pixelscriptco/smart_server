const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Public routes (no auth required)
router.post('/login', clientController.login);
router.post('/register', userController.register);

// Protected routes (auth required)
router.use(authMiddleware);

// User routes
router.get('/me', clientController.getUser);
router.put('/profile', clientController.updateProfile);
router.get('/stats', clientController.getAllStates);

// Project routes
router.get('/projects', clientController.listProjects);
router.get('/projects/:project_id', clientController.getProject);
router.get('/projects/:project_id/units', clientController.listUnits);

// Unit routes
router.get('/units/:unit_id', clientController.getUnitDetails);
router.put('/units/:unit_id', clientController.updateUnit);
router.put('/units/:unit_id/status', clientController.updateUnitStaus);
// Floor routes
router.get('/tower/:tower_id/floors', clientController.getFloors);

// Bookings routes
router.get('/bookings', clientController.listBookings);
router.put('/bookings/:booking_id/status', clientController.updateBookingStatus);

module.exports = router; 