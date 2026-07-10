const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();

// Public routes (if any)
// router.get('/public', ...);

// Protected routes
router.get('/profile', ClerkExpressRequireAuth(), getProfile);
router.post('/profile', ClerkExpressRequireAuth(), updateProfile);

module.exports = router;
