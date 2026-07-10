const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = "gemini-2.5-flash"; // Supported and recommended version as of Dec 2025

const withRetry = async (fn, maxAttempts = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            // Only retry on transient errors like 503 or 429
            const isTransient = error.status === 503 || error.status === 429 || error.message?.includes('overloaded');
            if (!isTransient || attempt === maxAttempts) throw error;

            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`[RETRY] Attempt ${attempt} failed (Status: ${error.status}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

const generateMCQ = async (topic, difficulty) => {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
    Generate 5 multiple-choice questions (MCQs) on the topic "${topic}" with difficulty "${difficulty}".
    Return the response ONLY as a valid JSON array.
    Each object in the array should have:
    - id: (unique string)
    - question: (string, wrap any code snippets in markdown code blocks e.g. \`\`\`cpp code \`\`\`)
    - options: (array of 4 strings, keep them concise)
    - correct_answer: (string, must match one of the options)
    - explanation: (string)
    
    Do not include any markdown formatting like \`\`\`json. Just the raw JSON array.
  `;

    try {
        const text = await withRetry(async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });

        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        const cleanText = (firstBracket !== -1 && lastBracket !== -1)
            ? text.substring(firstBracket, lastBracket + 1)
            : text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini MCQ Gen Error:", error);
        if (error.status === 503) {
            throw new Error("AI service is currently overloaded. Please try again in a few moments.");
        }
        throw new Error("Failed to generate MCQs: " + (error.message || "Unknown error"));
    }
};

const generateDSAProblem = async (difficulty) => {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
    Generate a generic coding interview problem (DSA) with difficulty "${difficulty}".
    Return the response ONLY as a valid JSON object.
    The object should have:
    - title: (string)
    - description: (string, markdown supported)
    - difficulty: (string)
    - examples: (array of objects with 'input' and 'output' strings)
    - constraints: (array of strings)
    - test_cases: (array of objects with 'input' and 'output' strings for hidden evaluation)
    - starter_code: (object with keys 'python', 'javascript', 'cpp', 'java' containing starter function signatures)
    
    Do not include any markdown formatting like \`\`\`json. Just the raw JSON object.
  `;

    try {
        const text = await withRetry(async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const cleanText = (firstBrace !== -1 && lastBrace !== -1)
            ? text.substring(firstBrace, lastBrace + 1)
            : text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini DSA Gen Error:", error);
        throw new Error("Failed to generate DSA problem");
    }
};

const generateResume = async (profileData, jobDescription) => {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
    Create a HIGH-SCORING, ATS-OPTIMIZED professional resume based on this data: ${JSON.stringify(profileData)}.
    ${jobDescription ? `MANDATORY: Optimize strictly for keyword density and thematic relevance to this job description: ${jobDescription}` : ''}
    
    Return pure HTML (no markdown, no \`\`\`, no <html>/<body> tags).
    Follow these ATS COMPLIANCE and PROFESSIONAL rules:

    1. ATS STRUCTURE:
       - Use standard, universally recognized section headers: "Professional Experience", "Technical Projects", "Education", "Technical Skills".
       - NEVER use tables, columns within sections, or unconventional graphics that confuse ATS parsers.
       - Use standard bullet points (<ul>/<li>).

    2. CONTENT OPTIMIZATION (THE X-Y-Z FORMULA):
       - For Experience and Projects, rewrite all bullet points using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".
       - Focus on quantifiable achievements (percentages, time saved, revenue generated, user growth).
       - Maintain high keyword density for role-specific skills.

    3. HEADER & LINKS:
       - CENTERED HEADER: The Name and Contact Info must be center-aligned for professional symmetry.
       - Contact Row 1: <span><a href="mailto:{Email}">{Email}</a></span> | <span>{Phone}</span> | <span>{District}, {StateAbbr}, {Country}</span>
       - Contact Row 2: <span><a href="{LinkedIn}" target="_blank" rel="noopener noreferrer">LinkedIn</a></span> ${profileData.personal.github ? `| <span><a href="${profileData.personal.github}" target="_blank" rel="noopener noreferrer">GitHub</a></span>` : ''} ${profileData.personal.portfolio ? `| <span><a href="${profileData.personal.portfolio}" target="_blank" rel="noopener noreferrer">Portfolio</a></span>` : ''}
       - MANDATORY: All project and social links must be clickable <a> tags.
       - NO CLUTTER: Avoid extra spaces or oversized icons.

    4. HTML TEMPLATE (Overleaf Style):
    <div class="header">
        <div class="full-name">{Name}</div>
        <div class="contact-info">Row 1 items</div>
        <div class="contact-info">Row 2 items</div>
    </div>

    <div class="section-title">Summary</div>
    <div class="summary-text">{Professional Summary (Generated from profileData.summary)}</div>

    <div class="section-title">Professional Experience</div>
    <div class="entry">
        <div class="entry-header">
            <span class="company">{Company}</span>
            <span class="date">{Duration}</span>
        </div>
        <div class="role">{Role}</div>
        <ul>
            <li>[X-Y-Z bullet point - MANDATORY: MUST BE EXACTLY 2 LINES]</li>
        </ul>
    </div>

    <div class="section-title">Technical Projects</div>
    <div class="entry">
        <div class="entry-header">
            <span class="company">{Project Name}</span>
            <span class="tech-stack">{Tech Stack}</span>
        </div>
        <div class="tech-stack-row">
            <span class="entry-links">
                {If projectLink: <a href="link" target="_blank">Code</a>}
                {If liveDemo: <a href="link" target="_blank">Demo</a>}
            </span>
            <span class="date">{Duration}</span>
        </div>
        <ul>
            <li>[Impact bullet point - MANDATORY: MUST BE EXACTLY 2 LINES]</li>
        </ul>
    </div>

    <div class="section-title">Education</div>
    <div class="entry">
        <div class="entry-header">
            <span class="school">{School}</span>
            <span class="date">{GPA} {gradeType}</span>
        </div>
        <div class="entry-header">
            <span class="degree">{Degree}</span>
            <span class="date">{Year}</span>
        </div>
    </div>

    <div class="section-title">Technical Skills</div>
    <div class="skills-section">
        <div class="skill-group"><span class="skill-label">Languages:</span> Skill1, Skill2, Skill3</div>
        <div class="skill-group"><span class="skill-label">Developer Tools:</span> Skill1, Skill2, Skill3</div>
        <div class="skill-group"><span class="skill-label">Frameworks/Libraries:</span> Skill1, Skill2, Skill3</div>
    </div>

    <div class="section-title">Achievements</div>
    <ul>
        <li>[Achievement 1]</li>
        <li>[Achievement 2]</li>
    </ul>

    Rules:
    - SKILLS: Each individual skill category MUST be on its own separate line.
    - PROJECT LAYOUT: 
        - Row 1: Project Name (Left) | Technologies Used (Extreme Right).
        - Row 2: Project Links (Left) | Project Duration (Extreme Right).
    - BULLET POINTS: EVERY bullet point in Experience and Projects MUST be exactly 2 lines long. ADJUST WORDING TO FILL EXACTLY 2 LINES.
    - SUMMARY: Use profileData.summary as the basis. If provided, polish it for keywords. If empty, generate a compelling professional summary. MANDATORY: The summary MUST be MAXIMUM 3 lines long.
    - ACHIEVEMENTS: List major achievements from profileData.achievements as a separate bulleted section.
    - LOCATION: Use simplified "City, StateAbbr, Country" format.
    - JUSTIFIED: Structure content for full text justification (text-align: justify).
    - Raw HTML only. No markdown.
  `;

    try {
        return await withRetry(async () => {
            const result = await model.generateContent(prompt);
            return result.response.text();
        });
    } catch (error) {
        console.error("Gemini Resume Gen Error:", error);
        throw new Error("Failed to generate Resume");
    }
};

const generateCoverLetter = async (resumeContext, jobDescription) => {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
    Write a persuasive cover letter for this job description:
    "${jobDescription}"
    
    Using this resume context:
    "${JSON.stringify(resumeContext)}"
    
    Tone: Professional, enthusiastic, and concise.
    Return ONLY the Markdown content.
  `;

    try {
        return await withRetry(async () => {
            const result = await model.generateContent(prompt);
            return result.response.text();
        });
    } catch (error) {
        console.error("Gemini Cover Letter Gen Error:", error);
        throw new Error("Failed to generate Cover Letter");
    }
};

const generateMarketInsights = async (industry, specialization, experience) => {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
    Generate detailed, personalized job market insights for a professional in the "${industry}" industry, specializing in "${specialization}" with "${experience}" years of experience.
    
    Return the response ONLY as a valid JSON object with the following structure:
    {
        "market_overview": {
            "outlook": "Positive/Neutral/Negative",
            "growth_rate": "percentage string",
            "demand_level": "High/Medium/Low",
            "summary": "Short paragraph summary"
        },
        "top_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
        "salary_ranges": [
            { "role": "Software Engineer", "min": 80000, "median": 120000, "max": 160000, "currency": "USD" },
            { "role": "Data Scientist", "min": 90000, "median": 130000, "max": 170000, "currency": "USD" },
             { "role": "Frontend Engineer", "min": 75000, "median": 115000, "max": 150000, "currency": "USD" },
             { "role": "Backend Engineer", "min": 85000, "median": 125000, "max": 165000, "currency": "USD" },
             { "role": "DevOps Engineer", "min": 95000, "median": 135000, "max": 175000, "currency": "USD" },
             { "role": "Mobile Developer", "min": 80000, "median": 120000, "max": 160000, "currency": "USD" }
        ],
        "key_trends": ["Trend 1", "Trend 2", "Trend 3"],
        "recommended_skills": ["Skill A", "Skill B", "Skill C"]
    }
    
    Ensure the data is realistic and relevant to 2024-2025 trends.
    Do not include any markdown formatting. Just the raw JSON object.
  `;

    try {
        const text = await withRetry(async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Market Insights Error:", error);
        // Fallback or rethrow
        throw new Error("Failed to generate personalized insights");
    }
};

module.exports = { generateMCQ, generateDSAProblem, generateResume, generateCoverLetter, generateMarketInsights };
