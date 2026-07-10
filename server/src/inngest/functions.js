const { inngest } = require("./client");
const { pool } = require("../config/db");
const { generateMarketInsights } = require("../services/geminiService");

// Define a function that runs every week
const jobMarketRefresh = inngest.createFunction(
    { id: "job-market-refresh" },
    { cron: "0 0 * * 0" }, // Weekly on Sunday
    async ({ step }) => {

        // Step 1: Data Gathering (AI-generated based on current trends)
        const marketData = await step.run("fetch-market-data", async () => {
            const data = await generateMarketInsights();

            // Fallback to basic structured data if AI fails
            if (!data || data.length === 0) {
                console.warn("Gemini failed to generate insights, using fallback data.");
                return [
                    { role: "Frontend Developer", skills: ["React", "TypeScript", "Next.js"], salary: { min: 70000, max: 130000, currency: "USD" }, demand: 88 },
                    { role: "Backend Developer", skills: ["Node.js", "PostgreSQL", "Docker"], salary: { min: 80000, max: 145000, currency: "USD" }, demand: 92 },
                    { role: "Data Scientist", skills: ["Python", "PyTorch", "SQL"], salary: { min: 95000, max: 170000, currency: "USD" }, demand: 85 },
                ];
            }
            return data;
        });

        // Step 2: Database Update
        await step.run("update-database", async () => {
            if (!marketData || marketData.length === 0) return { success: false, message: "No data to update" };

            // Clear old data (optional, or just append. User didn't specify cleanup, but weekly updates usually imply fresh state or history. 
            // Given "Internal cache empty", fresh might be better, but let's just insert for now as requested.)

            for (const job of marketData) {
                // Map role -> title, match schema: title, demand, salary, skills
                await pool.query(`
                INSERT INTO job_insights (title, demand, salary, skills, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [job.role, job.demand || 0, JSON.stringify(job.salary || {}), JSON.stringify(job.skills || [])]);
            }
        });

        return { success: true, count: marketData.length };
    }
);

module.exports = { jobMarketRefresh };
