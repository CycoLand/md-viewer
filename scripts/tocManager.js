// Table of Contents management

/**
 * Generates and displays the table of contents
 * @param {HTMLElement} mdEl - The markdown content element
 * @param {HTMLElement} tocEl - The TOC container element
 */
export function generateTOC(mdEl, tocEl) {
    if (!tocEl) return;

    const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const items = headings.map(h => {
        const level = parseInt(h.tagName.substring(1));
        return { id: h.id, text: h.textContent.replace(/^\s*▶\s*/, '').replace(/^\s*▼\s*/, ''), level };
    });

    if (items.length === 0) {
        tocEl.innerHTML = '';
    } else {
        const tocHtml = `
            <h4>Contents</h4>
            <ul>
                ${items.map(it => `
                    <li class="indent-${Math.min(5, Math.max(0, it.level - 1))}">
                        <a href="#${it.id}" data-target="${it.id}">${it.text}</a>
                    </li>
                `).join('')}
            </ul>
        `;
        tocEl.innerHTML = tocHtml;

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
