const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { getJobInsights } = require('../controllers/insightsController');

const router = express.Router();

router.get('/', ClerkExpressRequireAuth(), getJobInsights);

module.exports = router;
