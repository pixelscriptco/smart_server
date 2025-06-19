const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.loginCustomer);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Protected routes (require authentication)
router.get('/me', auth, userController.getCurrentUser);
router.get('/profile', auth, userController.updateLastLogin, userController.getUserById);
router.put('/profile', auth, userController.updateUser);
router.post('/change-password', auth, userController.changePassword);
router.post('/logout', auth, userController.logout);

module.exports = router; 