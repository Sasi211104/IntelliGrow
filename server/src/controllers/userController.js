const { pool } = require('../config/db');

// Get Profile by Clerk User ID
const getProfile = async (req, res) => {
    try {
        const userId = req.auth.userId; // Provided by Clerk middleware

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            // If profile doesn't exist, we might return 404 or an empty template.
            // For this app, let's return a 404 so the client knows to create one.
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// Create or Update Profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { email, full_name, role_interest, experience_level, skills, industry, specialization, years_of_experience, bio } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Upsert profile
        const query = `
      INSERT INTO profiles (id, email, full_name, role_interest, experience_level, skills, industry, specialization, years_of_experience, bio, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role_interest = EXCLUDED.role_interest,
        experience_level = EXCLUDED.experience_level,
        skills = EXCLUDED.skills,
        industry = EXCLUDED.industry,
        specialization = EXCLUDED.specialization,
        years_of_experience = EXCLUDED.years_of_experience,
        bio = EXCLUDED.bio,
        updated_at = NOW()
      RETURNING *;
    `;

        const values = [
            userId,
            email,
            full_name,
            role_interest,
            experience_level,
            JSON.stringify(skills || []),
            industry,
            specialization,
            years_of_experience,
            bio
        ];

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

module.exports = { getProfile, updateProfile };
