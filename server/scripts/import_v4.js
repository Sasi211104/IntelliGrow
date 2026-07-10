require('dotenv').config();
const { pool } = require('../src/config/db');
const axios = require('axios');
const csv = require('csv-parser');
const { normalizeDescription } = require('../src/utils/textNormalization');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DATASET_URL = 'https://huggingface.co/datasets/kaysss/leetcode-problem-detailed/resolve/main/questions_detailed.csv';

const START_INDEX = parseInt(process.argv[2]);
const END_INDEX = parseInt(process.argv[3]);

if (isNaN(START_INDEX) || isNaN(END_INDEX)) {
    console.error('Usage: node scripts/import_v4.js <START_INDEX> <END_INDEX>');
    process.exit(1);
}

async function requestOpenRouter(prompt) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    { role: "system", content: "You are a competitive programming assistant. Produce only valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "IntelliGrow-V4-Easy"
                }
            }
        );

        let content = response.data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

        return JSON.parse(content);
    } catch (err) {
        console.error('OpenRouter Error:', err.message);
        return null;
    }
}

async function processRow(row) {
    const title = row.questionTitle;
    const slug = row.TitleSlug;
    const difficulty = row.difficulty;
    const htmlContent = row.content;

    const startTime = Date.now();
    console.log(`\n📦 [V4-EASY] Processing: ${title} [${slug}]`);

    // 1. Normalize Description
    const cleanDescription = normalizeDescription(htmlContent);

    // 2. Fast Test Generation (Standard/Easy cases)
    const testCount = (difficulty === 'Hard') ? 12 : 6;
    const prompt = `
    Problem: ${title}
    Description: ${cleanDescription}
    Difficulty: ${difficulty}

    Tasks:
    1. Generate ${testCount} high-quality but STANDARD test cases.
       - Focus on inputs that are typical and follow the description examples.
       - Include edge cases (empty strings, empty arrays, single elements, max constraints).
       - **STRICT RAW STDIN FORMAT**:
         - **NO** variable names (e.g., NO "nums =", NO "target =").
         - **NO** descriptive labels or assignment syntax.
         - **NO** JSON-style brackets like [2,4,3] unless the problem explicitly uses them in the input format.
         - Format as raw values separated by newlines or spaces (Line 1: Param1, Line 2: Param2).
         - Example for Two Sum (nums=[2,7,11,15], target=9):
           "input": "2 7 11 15\\n9"
       - **CRITICAL**: Normalize ALL "output" values to strings. (e.g., Use "42" instead of 42).
    2. Extract the sample examples from the description above and include them as the first test cases, strictly converted to the RAW STDIN format.
    3. Provide "input_format" and "output_format" in markdown.

    Output JSON Format:
    {
      "test_cases": [{"input": "...", "output": "...", "is_example": true/false}],
      "input_format": "markdown...",
      "output_format": "markdown..."
    }
    `;

    console.log(`📡 Requesting Easy Mode Logic (Target < 10s)...`);
    const aiData = await requestOpenRouter(prompt);
    if (!aiData) {
        console.log(`❌ Failed for ${title}`);
        return;
    }

    const { test_cases, input_format, output_format } = aiData;

    // Safety: Normalize all outputs to strings in case LLM missed it
    const normalizedTests = test_cases.map(tc => ({
        input: String(tc.input),
        output: String(tc.output)
    }));

    const finalDescription = `${cleanDescription}\n\n### Input Format\n${input_format}\n\n### Output Format\n${output_format}`;

    // 3. DB Insert
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
                test_cases = EXCLUDED.test_cases,
                source = 'imported';
        `, [
            title, slug, difficulty, finalDescription,
            JSON.stringify(normalizedTests.filter((_, i) => i < 3)), // Save first 3 as examples for UI
            [],
            JSON.stringify({}), JSON.stringify({}),
            JSON.stringify(normalizedTests),
            [], [], 'imported'
        ]);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ [${title}] Success: ${normalizedTests.length} tests. Time: ${duration}s`);
    } catch (err) {
        console.error(`DB Error for ${title}:`, err.message);
    }
}

async function main() {
    console.log(`🚀 Starting Fast Import V4 (Easy Mode): ${START_INDEX} -> ${END_INDEX}`);

    const response = await axios({ method: 'get', url: DATASET_URL, responseType: 'stream' });
    let currentIndex = 0;
    const batch = [];

    response.data
        .pipe(csv())
        .on('data', (row) => {
            currentIndex++;
            if (currentIndex >= START_INDEX && currentIndex <= END_INDEX) batch.push(row);
        })
        .on('end', async () => {
            console.log(`CSV Parsed. Processing ${batch.length} problems...`);
            for (const row of batch) {
                await processRow(row);
                // Minimal delay
                await new Promise(r => setTimeout(r, 200));
            }
            console.log('\n🎉 Pipeline V4 Easy Mode Finished.');
            await pool.end();
            process.exit(0);
        });
}

main();
