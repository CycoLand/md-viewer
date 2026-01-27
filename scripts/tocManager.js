// Table of Contents management

/**
 * Generates and displays the table of contents
 * @param {HTMLElement} mdEl - The markdown content element
 * @param {HTMLElement} tocEl - The TOC container element
 */
export function generateTOC(mdEl, tocEl) {
    if (!tocEl) return;

    // Get current depth preference (default to 3)
    const depth = parseInt(tocEl.dataset.tocDepth || '3');
    
    // Build selector based on depth, excluding the document title
    let selector = '';
    for (let i = 1; i <= depth; i++) {
        selector += (i > 1 ? ', ' : '') + `h${i}:not(.document-title)`;
    }
    
    const headings = Array.from(mdEl.querySelectorAll(selector));
    
    // Check if there are any H1s in the rendered content
    const hasH1 = headings.some(h => h.tagName === 'H1');
    
    const items = headings.map(h => {
        const level = parseInt(h.tagName.substring(1));
        // If no H1s exist, shift all levels down by 1 for indentation
        const displayLevel = hasH1 ? level : level - 1;
        return { id: h.id, text: h.textContent.replace(/^\s*▶\s*/, '').replace(/^\s*▼\s*/, ''), level: displayLevel };
    });

    if (items.length === 0) {
        tocEl.innerHTML = '';
    } else {
        const tocHtml = `
            <div class="toc-header">
                <h4>Contents</h4>
                <select class="toc-depth-selector" data-depth="${depth}">
                    <option value="2" ${depth === 2 ? 'selected' : ''}>H1-H2</option>
                    <option value="3" ${depth === 3 ? 'selected' : ''}>H1-H3</option>
                    <option value="4" ${depth === 4 ? 'selected' : ''}>H1-H4</option>
                    <option value="6" ${depth === 6 ? 'selected' : ''}>All</option>
                </select>
            </div>
            <ul>
                ${items.map(it => `
                    <li class="indent-${Math.min(5, Math.max(0, it.level - 1))}">
                        <a href="#${it.id}" data-target="${it.id}">${it.text}</a>
                    </li>
                `).join('')}
            </ul>
        `;
        tocEl.innerHTML = tocHtml;

        // Add event listener to depth selector
        const depthSelector = tocEl.querySelector('.toc-depth-selector');
        depthSelector.addEventListener('change', (e) => {
            tocEl.dataset.tocDepth = e.target.value;
            generateTOC(mdEl, tocEl);
        });

        tocEl.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = a.getAttribute('data-target');
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        setupScrollSpy(headings, tocEl);
    }
}

/**
 * Sets up scroll spy for TOC highlighting
 * @param {Array<HTMLElement>} headings - Array of heading elements
 * @param {HTMLElement} tocEl - The TOC container element
 */
function setupScrollSpy(headings, tocEl) {
    const links = Array.from(tocEl.querySelectorAll('a'));
    const scrollContainer = document.querySelector('.content-area');
    
    if (!scrollContainer) return;
    
    function onScroll() {
        let currentId = null;
        // Get 1/3 down from the top of the viewport
        const viewportThird = window.innerHeight / 3;
        let closestDistance = Infinity;

        // Find which section's middle is closest to the viewport third point
        for (let i = 0; i < headings.length; i++) {
            const h = headings[i];
            
            // Get the next heading (or use a large value if this is the last one)
            const nextHeading = headings[i + 1];
            const currentTop = h.getBoundingClientRect().top;
            const nextTop = nextHeading ? nextHeading.getBoundingClientRect().top : currentTop + 1000;
            
            // Calculate the middle of this section
            const sectionMiddle = (currentTop + nextTop) / 2;
            
            // Calculate distance from section middle to viewport third point
            const distance = Math.abs(sectionMiddle - viewportThird);
            
            // If this section is closest so far, make it current
            if (distance < closestDistance) {
                closestDistance = distance;
                currentId = h.id;
            }
        }

        links.forEach(link => {
            const targetId = link.getAttribute('data-target');
            if (targetId === currentId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Listen to scroll events on the content-area, not window
    scrollContainer.addEventListener('scroll', onScroll);
    onScroll();
}
