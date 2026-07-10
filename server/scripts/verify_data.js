const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function checkData() {
    console.log("Checking job_insights table...");
    try {
        const result = await pool.query('SELECT * FROM job_insights ORDER BY created_at DESC LIMIT 5;');
        console.log("Found rows:", result.rowCount);
        console.table(result.rows);
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        await pool.end();
    }
}
checkData();
