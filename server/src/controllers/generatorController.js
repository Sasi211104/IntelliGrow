const { generateResume, generateCoverLetter } = require('../services/geminiService');
const { pool } = require('../config/db');

const createResume = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { jobDescription, title, ...wizardData } = req.body; // Extract wizard data

        // Use wizard data if available (from new UI), otherwise fallback to DB profile (legacy)
        let profileData = wizardData;

        // If wizard data is empty/incomplete, try fetching legacy profile (optional fallback)
        if (!profileData || Object.keys(profileData).length === 0 || !profileData.personal) {
            const profileResult = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
            if (profileResult.rows.length > 0) {
                profileData = profileResult.rows[0];
            }
        }

        // 2. Generate Resume via Gemini
        const markdown = await generateResume(profileData, jobDescription);

        // 3. Save to generated_docs
        await pool.query(
            `INSERT INTO generated_docs (user_id, type, title, content_markdown, original_data_snapshot)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'RESUME', title || 'My Professional Resume', markdown, JSON.stringify(profileData)]
        );

        res.json({ content: markdown });
    } catch (error) {
        console.error('Resume Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate and save resume' });
    }
};

const createCoverLetter = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { jobDescription, title } = req.body;

        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // 1. Fetch Profile Data/Resume Context from DB
        const profileResult = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const profileData = profileResult.rows[0];

        // 2. Generate Cover Letter via Gemini
        const markdown = await generateCoverLetter(profileData, jobDescription);

        // 3. Save to generated_docs
        await pool.query(
            `INSERT INTO generated_docs (user_id, type, title, content_markdown, original_data_snapshot)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'COVER_LETTER', title || 'Professional Cover Letter', markdown, JSON.stringify({ profileData, jobDescription })]
        );

        res.json({ content: markdown });
    } catch (error) {
        console.error('Cover Letter Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate and save cover letter' });
    }
};

module.exports = { createResume, createCoverLetter };
