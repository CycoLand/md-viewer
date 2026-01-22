// Code block enhancement utilities

/**
 * Wraps comment-only lines in a span for proper collapsing
 * @param {HTMLElement} codeElement - The code element to process
 */
export function collapseCommentLines(codeElement) {
    // Find all comment elements and check if they're on their own line
    const commentNodes = codeElement.querySelectorAll('.hljs-comment');
    
    commentNodes.forEach(commentNode => {
        // Skip if already wrapped
        if (commentNode.closest('.comment-only-line')) {
            return;
        }
        
        // Get text before comment on same line
        let textBefore = '';
        let currentNode = commentNode.previousSibling;
        
        while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const text = currentNode.textContent;
                const lastNewlineIndex = text.lastIndexOf('\n');
                if (lastNewlineIndex !== -1) {
                    textBefore = text.substring(lastNewlineIndex + 1) + textBefore;
                    break;
                }
                textBefore = text + textBefore;
            } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                // There's other code on this line (unless it's another wrapped comment)
                if (!currentNode.classList || !currentNode.classList.contains('comment-only-line')) {
                    return;
                }
            }
            currentNode = currentNode.previousSibling;
        }
        
        // Get text after comment on same line
        let textAfter = '';
        currentNode = commentNode.nextSibling;
        
        while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const text = currentNode.textContent;
                const firstNewlineIndex = text.indexOf('\n');
                if (firstNewlineIndex !== -1) {
                    textAfter = textAfter + text.substring(0, firstNewlineIndex);
                    break;
                }
                textAfter = textAfter + text;
            } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                // There's other code on this line
                if (!currentNode.classList || !currentNode.classList.contains('comment-only-line')) {
                    return;
                }
            }
            currentNode = currentNode.nextSibling;
        }
        
        // If both before and after are just whitespace, this is a comment-only line
        if (textBefore.trim() === '' && textAfter.trim() === '') {
            // Wrap the comment and surrounding whitespace up to newlines
            const wrapper = document.createElement('span');
            wrapper.className = 'comment-only-line';
            // Don't set display: none - let CSS handle it with transitions
            
            const parent = commentNode.parentNode;
            parent.insertBefore(wrapper, commentNode);
            
            // Add preceding whitespace
            currentNode = wrapper.previousSibling;
            const nodesToMove = [];
            while (currentNode) {
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent;
                    const lastNewlineIndex = text.lastIndexOf('\n');
                    if (lastNewlineIndex !== -1) {
                        // Split this text node at the newline
                        const afterNewline = text.substring(lastNewlineIndex + 1);
                        const beforeNewline = text.substring(0, lastNewlineIndex + 1);
                        if (afterNewline) {
                            const afterNode = document.createTextNode(afterNewline);
                            nodesToMove.push(afterNode);
                        }
                        currentNode.textContent = beforeNewline;
                        break;
                    }
                    nodesToMove.push(currentNode);
                    currentNode = currentNode.previousSibling;
                } else {
                    break;
                }
            }
            
            // Add nodes before comment
            nodesToMove.reverse().forEach(n => wrapper.appendChild(n));
            
            // Add the comment itself
            wrapper.appendChild(commentNode);
            
            // Add trailing whitespace/newline
            currentNode = wrapper.nextSibling;
            while (currentNode) {
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent;
                    const firstNewlineIndex = text.indexOf('\n');
                    if (firstNewlineIndex !== -1) {
                        const beforeNewline = text.substring(0, firstNewlineIndex + 1);
                        const afterNewline = text.substring(firstNewlineIndex + 1);
                        wrapper.appendChild(document.createTextNode(beforeNewline));
                        if (afterNewline) {
                            currentNode.textContent = afterNewline;
                        } else {
                            const next = currentNode.nextSibling;
                            parent.removeChild(currentNode);
                            currentNode = next;
                        }
                        break;
                    }
                    const next = currentNode.nextSibling;
                    wrapper.appendChild(currentNode);
                    currentNode = next;
                } else {
                    break;
                }
            }
        }
    });
}

/**
 * Restores comment lines by unwrapping them
 * @param {HTMLElement} codeElement - The code element to process
 */
export function restoreCommentLines(codeElement) {
    const wrappedComments = codeElement.querySelectorAll('.comment-only-line');
    wrappedComments.forEach(wrapper => {
        const parent = wrapper.parentNode;
        while (wrapper.firstChild) {
            parent.insertBefore(wrapper.firstChild, wrapper);
        }
        parent.removeChild(wrapper);
    });
}

/**
 * Enhances all code blocks with syntax highlighting, buttons, and comment controls
 * @param {HTMLElement} mdEl - The markdown content element
 */
export function enhanceCodeBlocks(mdEl) {
    mdEl.querySelectorAll('pre code').forEach((block) => {
        // Apply syntax highlighting
        hljs.highlightElement(block);
        
        // Wrap comment-only lines for proper collapsing
        collapseCommentLines(block);
        
        // Get language from class
        const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
        const language = languageClass ? languageClass.replace('language-', '') : 'text';
        
        // Wrap code block with header
        const pre = block.parentElement;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // Create header with language and buttons
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        const langLabel = document.createElement('span');
        langLabel.className = 'code-language';
        langLabel.textContent = language.toUpperCase();
        
        // Create all buttons
        const copyBtn = createCopyButton(block);
        const copyMdBtn = createCopyMdButton(block, language);
        const toggleCommentsBtn = createToggleCommentsButton(wrapper);
        
        // Create button group container
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'code-button-group';
        buttonGroup.appendChild(toggleCommentsBtn);
        buttonGroup.appendChild(copyMdBtn);
        buttonGroup.appendChild(copyBtn);
        
        header.appendChild(langLabel);
        header.appendChild(buttonGroup);
        
        // Insert wrapper before pre, then move pre into wrapper
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });
}

/**
 * Creates a copy button for code blocks
 * @param {HTMLElement} block - The code block element
 * @returns {HTMLElement} The copy button element
 */
function createCopyButton(block) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    copyBtn.title = 'Copy to clipboard';
    
    copyBtn.addEventListener('click', () => {
        const code = block.textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });
    
    return copyBtn;
}

/**
 * Creates a copy-as-markdown button for code blocks
 * @param {HTMLElement} block - The code block element
 * @param {string} language - The code language
 * @returns {HTMLElement} The copy markdown button element
 */
function createCopyMdButton(block, language) {
    const copyMdBtn = document.createElement('button');
    copyMdBtn.className = 'code-copy-btn';
    copyMdBtn.innerHTML = '<i class="fas fa-file-code"></i> Copy MD';
    copyMdBtn.title = 'Copy as markdown';
    
    copyMdBtn.addEventListener('click', () => {
        const code = block.textContent;
        const mdText = '```' + language + '\n' + code + '\n```';
        navigator.clipboard.writeText(mdText).then(() => {
            copyMdBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyMdBtn.classList.add('copied');
            setTimeout(() => {
                copyMdBtn.innerHTML = '<i class="fas fa-file-code"></i> Copy MD';
                copyMdBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });
    
    return copyMdBtn;
}

/**
 * Creates a toggle comments button for code blocks
 * @param {HTMLElement} wrapper - The code block wrapper element
 * @returns {HTMLElement} The toggle comments button element
 */
function createToggleCommentsButton(wrapper) {
    const toggleCommentsBtn = document.createElement('button');
    toggleCommentsBtn.className = 'code-copy-btn code-toggle-comments';
    toggleCommentsBtn.innerHTML = '<i class="fas fa-eye"></i> Comments';
    toggleCommentsBtn.title = 'Toggle comments visibility';
    
    toggleCommentsBtn.addEventListener('click', () => {
        const isHidden = wrapper.classList.contains('hide-comments');
        
        // Lock the width on first toggle to prevent width changes
        if (!wrapper.style.width) {
            const currentWidth = wrapper.offsetWidth;
            wrapper.style.width = currentWidth + 'px';
        }
        
        if (!isHidden) {
            // Hiding comments with CSS transition
            wrapper.classList.add('hide-comments');
            toggleCommentsBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Comments';
            toggleCommentsBtn.classList.add('active');
        } else {
            // Showing comments with CSS transition
            wrapper.classList.remove('hide-comments');
            toggleCommentsBtn.innerHTML = '<i class="fas fa-eye"></i> Comments';
            toggleCommentsBtn.classList.remove('active');
        }
    });
    
    return toggleCommentsBtn;
}
