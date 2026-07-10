const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function fixMigration() {
    console.log("Fixing migration for job_insights...");
    try {
        // DROP TABLE
        console.log("Dropping old table...");
        await pool.query(`DROP TABLE IF EXISTS job_insights;`);

        // RECREATE TABLE
        console.log("Creating new table...");
        const createTableQuery = `
            CREATE TABLE job_insights (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                demand INTEGER NOT NULL DEFAULT 0,
                salary JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        await pool.query(createTableQuery);
        console.log("Fix successful: job_insights table dropped and recreated.");
    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await pool.end();
    }
}

fixMigration();
