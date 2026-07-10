// src/app.js
const express = require('express');
const cors = require('cors');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
console.log("Loading user routes...");
app.use('/api/v1/user', require('./routes/userRoutes'));

console.log("Loading interview routes...");
app.use('/api/v1/interview', require('./routes/interviewRoutes'));

console.log("Loading generator routes...");
app.use('/api/v1/generator', require('./routes/generatorRoutes'));

console.log("Loading code routes...");
app.use('/api/v1/code', require('./routes/codeRoutes'));

console.log("Loading insights routes...");
app.use('/api/v1/insights', require('./routes/insightsRoutes'));

console.log("Loading inngest routes...");
app.use("/api/inngest", require("./routes/inngestRoute"));
console.log("All routes loaded.");


// Health Check
app.get('/', (req, res) => {
    res.send('IntelliGrow API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
