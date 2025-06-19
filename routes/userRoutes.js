const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Protected routes (require authentication)
router.get('/me', auth, userController.getCurrentUser);
router.get('/clients', auth, userController.getClients);
router.patch('/clients/:id', auth, userController.updateClients);
router.get('/profile', auth, userController.updateLastLogin, userController.getUserById);
router.put('/profile', auth, userController.updateUser);
router.post('/change-password', auth, userController.changePassword);
router.post('/logout', auth, userController.logout);

module.exports = router; 