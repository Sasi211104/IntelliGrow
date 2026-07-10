const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { createResume, createCoverLetter } = require('../controllers/generatorController');

const router = express.Router();

router.post('/resume', ClerkExpressRequireAuth(), createResume);
router.post('/cover-letter', ClerkExpressRequireAuth(), createCoverLetter);

module.exports = router;
