/**
 * Normalizes problem descriptions by stripping HTML and structuring Markdown.
 * Preserves: Headings, Bullet points, Code blocks, Bold/Italic.
 */
function normalizeDescription(html) {
    if (!html) return '';

    let text = html;

    // 1. Handle code blocks (pre/code)
    text = text.replace(/<pre>(.*?)<\/pre>/gis, (match, p1) => {
        // Strip tags inside pre but keep content
        const content = p1.replace(/<[^>]*>/g, '');
        return `\n\`\`\`\n${content.trim()}\n\`\`\`\n`;
    });
    text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');

    // 2. Handle blockquotes
    text = text.replace(/<blockquote>(.*?)<\/blockquote>/gis, (match, p1) => `\n> ${p1.trim()}\n`);

    // 3. Headings
    text = text.replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, (match, p1) => `\n### ${p1.trim()}\n`);

    // 4. Paragraphs and Line Breaks
    text = text.replace(/<p>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n');

    // 5. Lists
    text = text.replace(/<ul>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ol>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<\/li>/gi, '\n');

    // 6. Emphasis
    text = text.replace(/<b>(.*?)<\/b>|<strong>(.*?)<\/strong>/gi, '**$1$2**');
    text = text.replace(/<i>(.*?)<\/i>|<em>(.*?)<\/em>/gi, '*$1$2*');

    // 7. Strip all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // 8. Handle HTML entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // 9. Spacing Cleanup
    // - Merge multiple newlines (max 2)
    // - Trim each line
    // - Remove leading/trailing newlines
    text = text.split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return text;
}

module.exports = { normalizeDescription };
