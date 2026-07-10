const fs = require('fs');

// Handle uncaught exceptions immediately
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥');
    fs.writeFileSync('crash.log', `Uncaught Exception: ${err.message}\nStack: ${err.stack}`);
    process.exit(1);
});

require('dotenv').config();
console.log("Starting application...");

const app = require('./app');
console.log("App module loaded.");

const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

console.log("Attempting DB connection...");

// Connect to DB and start server
pool.connect().then(client => {
    console.log('DB Connected successfully');
    client.release();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥');
        fs.writeFileSync('crash.log', `Unhandled Rejection: ${err.message}\nStack: ${err.stack}`);
        server.close(() => {
            process.exit(1);
        });
    });
}).catch(err => {
    console.error('Failed to connect to Database:', err.message);
    fs.writeFileSync('db_error.log', `DB Connection Error: ${err.message}\nStack: ${err.stack}`);
    process.exit(1);
});
