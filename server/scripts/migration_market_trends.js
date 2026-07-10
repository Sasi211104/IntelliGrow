const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function runMigration() {
    console.log("Starting migration: Creating market_trends table...");
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS market_trends (
                id SERIAL PRIMARY KEY,
                industry VARCHAR(255) NOT NULL,
                specialization VARCHAR(255) NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(industry, specialization)
            );
        `;

        await pool.query(createTableQuery);
        console.log("Migration successful: market_trends table created.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

runMigration();
