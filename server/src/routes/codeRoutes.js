const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { runCode, submitCode, getSubmissionHistory } = require('../controllers/codeController');

const router = express.Router();

router.post('/run', ClerkExpressRequireAuth(), runCode);
router.post('/submit', ClerkExpressRequireAuth(), submitCode);
router.get('/submissions/:problemId', ClerkExpressRequireAuth(), getSubmissionHistory);

module.exports = router;
