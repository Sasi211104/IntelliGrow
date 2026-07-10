const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { createMCQ, createDSAProblem, saveQuizResult, getQuizHistory, completeSession, getDSAProblemStats } = require('../controllers/interviewController');

const router = express.Router();

// Generate MCQ (Protected)
router.post('/mcq', ClerkExpressRequireAuth(), createMCQ);

// Generate DSA (Protected)
router.post('/dsa', ClerkExpressRequireAuth(), createDSAProblem);

// Get DSA Stats (Protected)
router.get('/dsa/stats', ClerkExpressRequireAuth(), getDSAProblemStats);

// Save Quiz Result (Protected)
router.post('/result', ClerkExpressRequireAuth(), saveQuizResult);

// Complete/Abandon Session (Protected)
router.post('/session/complete', ClerkExpressRequireAuth(), completeSession);

// Get Quiz History (Protected)
router.get('/history', ClerkExpressRequireAuth(), getQuizHistory);

module.exports = router;
