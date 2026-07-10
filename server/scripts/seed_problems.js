require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SEED_FILE = process.argv[2];
const SOURCE_TAG = process.argv[3] || 'curated';

if (!SEED_FILE) {
    console.error('Usage: node seed_problems.js <JSON_FILE_PATH> [SOURCE_TAG]');
    process.exit(1);
}

async function seed() {
    console.log(`🌱 Seeding problems from ${SEED_FILE} (Source: ${SOURCE_TAG})...`);

    // Support relative paths
    const filePath = path.resolve(process.cwd(), SEED_FILE);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const problems = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${problems.length} problems.`);

    for (const p of problems) {
        // Construct slug if missing
        const slug = p.slug || p.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

        try {
            await pool.query(`
                INSERT INTO dsa_problems (
                    title, slug, difficulty, description, 
                    examples, constraints, starter_code, 
                    driver_code, test_cases, tags, company_tags, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (slug) DO UPDATE SET
                    description = EXCLUDED.description,
                    examples = EXCLUDED.examples,
                    constraints = EXCLUDED.constraints,
                    starter_code = EXCLUDED.starter_code,
                    driver_code = EXCLUDED.driver_code,
                    test_cases = EXCLUDED.test_cases,
                    source = EXCLUDED.source
            `, [
                p.title,
                slug,
                p.difficulty,
                p.description,
                JSON.stringify(p.examples || []),
                p.constraints || [],
                JSON.stringify(p.starter_code || {}),
                JSON.stringify(p.driver_code || {}),
                JSON.stringify(p.test_cases || []),
                p.tags || [],
                p.company_tags || [],
                SOURCE_TAG
            ]);
            console.log(`✅ [${p.title}] Inserted/Updated.`);
        } catch (err) {
            console.error(`❌ Error inserting ${p.title}:`, err);
        }
    }
    await pool.end();
}

seed();
