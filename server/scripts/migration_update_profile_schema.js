const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function runMigration() {
    console.log("Starting migration: Updating profiles table schema...");
    try {
        const alterTableQuery = `
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS industry VARCHAR(255),
            ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
            ADD COLUMN IF NOT EXISTS years_of_experience VARCHAR(50),
            ADD COLUMN IF NOT EXISTS bio TEXT;
        `;

        await pool.query(alterTableQuery);
        console.log("Migration successful: Updated profiles table with new fields.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

runMigration();
