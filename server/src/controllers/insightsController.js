const { pool } = require('../config/db');
const { generateMarketInsights } = require('../services/geminiService');

const getJobInsights = async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Get User Profile
        const userResult = await pool.query('SELECT industry, specialization, years_of_experience FROM profiles WHERE id = $1', [userId]);

        // Check if profile exists and has required fields
        if (userResult.rows.length === 0 || !userResult.rows[0].industry) {
            // Return specific status to trigger redirect
            return res.status(400).json({ error: 'Profile incomplete', redirectTo: '/complete-profile' });
        }

        const { industry, specialization, years_of_experience } = userResult.rows[0];

        // 2. Check Cache (market_trends)
        // Cache valid for 7 days
        const cacheResult = await pool.query(
            'SELECT * FROM market_trends WHERE industry = $1 AND specialization = $2 AND created_at > NOW() - INTERVAL \'7 days\'',
            [industry, specialization]
        );

        if (cacheResult.rows.length > 0) {
            console.log(`Serving cached insights for ${industry} - ${specialization}`);
            return res.json(cacheResult.rows[0].data);
        }

        // 3. Generate New Insights
        console.log(`Generating NEW insights for ${industry} - ${specialization}...`);
        const insights = await generateMarketInsights(industry, specialization, years_of_experience);

        // 4. Cache Result (Upsert)
        await pool.query(`
            INSERT INTO market_trends (industry, specialization, data, created_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (industry, specialization)
            DO UPDATE SET data = EXCLUDED.data, created_at = NOW()
        `, [industry, specialization, JSON.stringify(insights)]);

        res.json(insights);

    } catch (error) {
        console.error("Fetch Insights Error:", error);
        res.status(500).json({ error: 'Failed to fetch job insights' });
    }
};

module.exports = { getJobInsights };
