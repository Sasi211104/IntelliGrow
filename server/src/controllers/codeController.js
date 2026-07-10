const { executeCode } = require('../services/codeExecutionService');
const { pool } = require('../config/db');

const runCode = async (req, res) => {
    try {
        const { language, code, stdin, problemId } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        // 1. If problemId is provided, run against samples
        if (problemId) {
            const problemResult = await pool.query('SELECT * FROM dsa_problems WHERE id = $1', [problemId]);
            if (problemResult.rows.length === 0) {
                return res.status(404).json({ error: 'Problem not found' });
            }

            const problem = problemResult.rows[0];
            const examples = problem.test_cases.slice(0, 3); // Run first 3 as samples

            const results = [];
            for (const tc of examples) {
                const executionResult = await executeCode(language, code, tc.input);

                // Safe extraction with fallbacks to prevent crashes
                const run = executionResult.run || {};
                const compile = executionResult.compile || {};

                const output = run.output || "";
                const stderr = run.stderr || compile.stderr || compile.output || ""; // Capture compile errors!
                const exitCode = run.code !== undefined ? run.code : (compile.code !== undefined ? compile.code : 1);

                results.push({
                    input: tc.input,
                    output: output,
                    expected: tc.output,
                    passed: String(output).trim() === String(tc.output).trim() && exitCode === 0,
                    stderr: stderr,
                    code: exitCode
                });

                if (stderr || exitCode !== 0) break;
            }

            return res.json({ results });
        }

        // 2. Otherwise, Raw Execution with custom stdin
        console.log(`[DEBUG] Executing code (Raw). Stdin: "${stdin || ''}"`);
        const result = await executeCode(language, code, stdin);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const submitCode = async (req, res) => {
    try {
        const { language, code, problemId } = req.body;
        const userId = req.auth.userId;

        if (!code || !problemId || !language) {
            return res.status(400).json({ error: 'Code, language, and problemId are required' });
        }

        // 1. Fetch Problem Test Cases
        const problemResult = await pool.query('SELECT * FROM dsa_problems WHERE id = $1', [problemId]);
        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const problem = problemResult.rows[0];
        const testCases = problem.test_cases || [];

        if (testCases.length === 0) {
            return res.status(400).json({ error: 'No test cases found for this problem' });
        }

        // INTERVIEW MODE: Raw Execution
        // No driver wrapping.
        const finalCode = code;

        console.log(`[DEBUG] [SUBMIT] Raw Execution for problem: "${problem.title}"`);

        let passedCount = 0;
        let finalStatus = 'Accepted';
        let totalExecutionTime = 0;
        let firstFailure = null;

        const results = [];

        // 2. Run code against test cases
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            console.log(`[DEBUG] [SUBMIT] Running test case ${i}. Input: "${tc.input}"`);
            const executionResult = await executeCode(language, finalCode, tc.input);

            // Safe extraction with fallbacks
            const run = executionResult.run || {};
            const compile = executionResult.compile || {};

            const output = run.output || "";
            const stderr = run.stderr || compile.stderr || compile.output || "";
            const exitCode = run.code !== undefined ? run.code : (compile.code !== undefined ? compile.code : 1);
            const execTime = (run.time || 0);

            totalExecutionTime += execTime;

            const actualOutput = String(output).trim();
            const expectedOutput = String(tc.output).trim();
            const passed = actualOutput === expectedOutput && !stderr && exitCode === 0;

            if (passed) {
                passedCount++;
            } else if (!firstFailure) {
                if (execTime > 2.0) finalStatus = 'Time Limit Exceeded';
                else if (stderr || exitCode !== 0) finalStatus = 'Runtime Error';
                else finalStatus = 'Wrong Answer';

                firstFailure = {
                    testCaseIndex: i,
                    expected: expectedOutput,
                    actual: actualOutput,
                    input: tc.input,
                    error: stderr || (exitCode !== 0 ? output : null)
                };
            }

            results.push({
                input: tc.input,
                output: output,
                expected: tc.output,
                passed: passed,
                stderr: stderr,
                code: exitCode
            });
        }

        // 3. Store result in dsa_submissions table
        const submissionQuery = `
            INSERT INTO dsa_submissions (user_id, problem_id, language, code, status, execution_time, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;
        const submissionValues = [
            userId,
            problemId,
            language,
            code,
            finalStatus,
            Math.round(totalExecutionTime * 1000)
        ];

        const savedSubmission = await pool.query(submissionQuery, submissionValues);

        // 4. Update Session Status if Accepted
        const { sessionId } = req.body;
        if (sessionId && finalStatus === 'Accepted') {
            await pool.query(
                `UPDATE interview_sessions SET status = $1, end_time = NOW() WHERE id = $2 AND user_id = $3`,
                ['COMPLETED', sessionId, userId]
            );
        }

        res.json({
            status: finalStatus,
            passed: passedCount,
            total: testCases.length,
            submissionId: savedSubmission.rows[0].id,
            failure: firstFailure,
            results: results
        });

    } catch (error) {
        console.error('Submission Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getSubmissionHistory = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { problemId } = req.params;

        if (!problemId) {
            return res.status(400).json({ error: 'Problem ID is required' });
        }

        const result = await pool.query(
            `SELECT id, status, language, code, execution_time, created_at 
             FROM dsa_submissions 
             WHERE user_id = $1 AND problem_id = $2 
             ORDER BY created_at DESC`,
            [userId, problemId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Fetch Submission History Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { runCode, submitCode, getSubmissionHistory };
