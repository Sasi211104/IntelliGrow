const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function runMigration() {
    console.log("Starting migration for job_insights...");
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS job_insights (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                demand INTEGER NOT NULL DEFAULT 0,
                salary JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        await pool.query(createTableQuery);
        console.log("Migration successful: job_insights table created or already exists.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

runMigration();
