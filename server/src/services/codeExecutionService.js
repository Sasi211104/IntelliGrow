const axios = require('axios');

// Piston API URL
const PISTON_API = 'https://emkc.org/api/v2/piston';

const executeCode = async (language, code, stdin = "") => {
    // Map our app's language keys to Piston's
    const langMap = {
        'javascript': { language: 'javascript', version: '18.15.0' },
        'python': { language: 'python', version: '3.10.0' },
        'java': { language: 'java', version: '15.0.2' },
        'cpp': { language: 'c++', version: '10.2.0' },
        'c': { language: 'c', version: '10.2.0' },
    };

    const config = langMap[language];
    if (!config) {
        throw new Error('Unsupported language');
    }

    try {
        const response = await axios.post(`${PISTON_API}/execute`, {
            language: config.language,
            version: config.version,
            files: [
                {
                    content: code,
                },
            ],
            stdin: stdin,
        });

        return response.data;
    } catch (error) {
        console.error('Piston Execution Error:', error.message);
        throw new Error('Code execution failed');
    }
};

module.exports = { executeCode };
