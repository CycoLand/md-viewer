/**
 * Strip inline markdown syntax from a raw markdown string.
 * @param {string} text
 * @returns {string}
 */
export function stripInlineMarkdown(text) {
    if (!text) return '';

    let result = String(text);

    result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
    result = result.replace(/!\[([^\]]*)\]\[[^\]]*\]/g, '$1');
    result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    result = result.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');
    result = result.replace(/`([^`]+)`/g, '$1');
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
    result = result.replace(/___([^_]+)___/g, '$1');
    result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
    result = result.replace(/__([^_]+)__/g, '$1');
    result = result.replace(/\*([^*]+)\*/g, '$1');
    result = result.replace(/_([^_]+)_/g, '$1');
    result = result.replace(/~~([^~]+)~~/g, '$1');
    result = result.replace(/<[^>]+>/g, '');

    return result.trim();
}

/**
 * Replace rendered heading contents with plain text (no inline markdown styling).
 * @param {ParentNode} rootEl
 */
export function stripHeadingInlineMarkdown(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
        heading.textContent = heading.textContent;
    });
}
