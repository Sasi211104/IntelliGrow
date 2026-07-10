const { generateMCQ } = require('../services/geminiService');
const { pool } = require('../config/db');

const createMCQ = async (req, res) => {
    const userId = req.auth.userId;
    try {
        const { topic, difficulty } = req.body;
        if (!topic || !difficulty) {
            return res.status(400).json({ error: 'Topic and difficulty are required' });
        }

        const questions = await generateMCQ(topic, difficulty);

        // Start Session
        const sessionResult = await pool.query(
            `INSERT INTO interview_sessions (user_id, type, topic, status) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [userId, 'MCQ', topic, 'IN_PROGRESS']
        );

        res.json({
            questions,
            sessionId: sessionResult.rows[0].id
        });
    } catch (error) {
        console.error("Create MCQ Error:", error);
        res.status(error.message?.includes('AI service') ? 503 : 500).json({
            error: error.message || 'Failed to generate quiz'
        });
    }
};

const createDSAProblem = async (req, res) => {
    const userId = req.auth.userId;
    try {
        const { difficulty, tag, problemIndex } = req.body;

        let query = 'SELECT * FROM dsa_problems';
        let params = [];
        let whereClauses = [];

        if (difficulty) {
            params.push(difficulty);
            whereClauses.push(`difficulty = $${params.length}`);
        }
        if (tag) {
            params.push(tag);
            whereClauses.push(`$${params.length} = ANY(tags)`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        if (problemIndex !== undefined && !isNaN(problemIndex)) {
            console.log(`[DEBUG] Fetching by index: ${problemIndex}`);
            // Sort by ID to ensure stable indexing when choosing by number
            query += ' ORDER BY id ASC LIMIT 1 OFFSET $' + (params.length + 1);
            params.push(Math.max(0, parseInt(problemIndex) - 1));
        } else {
            console.log(`[DEBUG] Fetching random problem`);
            query += ' ORDER BY RANDOM() LIMIT 1';
        }

        console.log(`[DEBUG] Final Query: ${query}`);
        console.log(`[DEBUG] Params: ${JSON.stringify(params)}`);

        const result = await pool.query(query, params);
        console.log(`[DEBUG] Found rows: ${result.rows.length}`);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No problems found matching your criteria' });
        }

        const problem = result.rows[0];

        // Start Session
        const sessionResult = await pool.query(
            `INSERT INTO interview_sessions (user_id, type, problem_id, status) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [userId, 'DSA', problem.id, 'IN_PROGRESS']
        );

        // Strip hidden test cases
        const { test_cases, ...publicProblem } = problem;

        res.json({
            problem: publicProblem,
            sessionId: sessionResult.rows[0].id
        });
    } catch (error) {
        console.error("Fetch DSA Problem Error:", error);
        res.status(500).json({ error: 'Failed to retrieve DSA problem' });
    }
};

const saveQuizResult = async (req, res) => {
    const { topic, difficulty, score, totalQuestions, questions, sessionId } = req.body;
    const userId = req.auth.userId;

    const insertQuiz = async () => {
        await pool.query(
            `INSERT INTO quiz_attempts (user_id, topic, difficulty, score, total_questions, questions_snapshot)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, topic, difficulty, score, totalQuestions, JSON.stringify(questions)]
        );
    };

    try {
        await insertQuiz();

        // Update Session to COMPLETED
        if (sessionId) {
            await pool.query(
                `UPDATE interview_sessions SET status = $1, end_time = NOW() WHERE id = $2 AND user_id = $3`,
                ['COMPLETED', sessionId, userId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        if (error.code === '23503') {
            try {
                console.log("Profile missing for user, creating placeholder...");
                await pool.query(
                    `INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
                    [userId, `user_${userId}@placeholder.com`, 'Anonymous User']
                );
                await insertQuiz();
                return res.json({ success: true });
            } catch (retryError) {
                console.error("Retry Save Quiz Error:", retryError);
                return res.status(500).json({ error: 'Failed to save quiz result after retry' });
            }
        }
        console.error("Save Quiz Error:", error);
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
};

const completeSession = async (req, res) => {
    const { sessionId, status } = req.body;
    const userId = req.auth.userId;

    if (!sessionId || !status) {
        return res.status(400).json({ error: 'Session ID and status are required' });
    }

    if (!['COMPLETED', 'ABANDONED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid session status' });
    }

    try {
        await pool.query(
            `UPDATE interview_sessions SET status = $1, end_time = NOW() WHERE id = $2 AND user_id = $3`,
            [status, sessionId, userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Complete Session Error:", error);
        res.status(500).json({ error: 'Failed to update session' });
    }
};

const getQuizHistory = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const result = await pool.query(
            'SELECT * FROM quiz_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Fetch Quiz History Error:", error);
        res.status(500).json({ error: 'Failed to fetch quiz history' });
    }
};

const getDSAProblemStats = async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM dsa_problems');
        res.json({ totalProblems: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error("Fetch DSA Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch problem statistics' });
    }
};

module.exports = { createMCQ, createDSAProblem, saveQuizResult, getQuizHistory, completeSession, getDSAProblemStats };
