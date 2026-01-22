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
    
    function onScroll() {
        let currentId = null;
        const scrollPos = window.scrollY + 100;

        for (let i = headings.length - 1; i >= 0; i--) {
            const h = headings[i];
            if (h.offsetTop <= scrollPos) {
                currentId = h.id;
                break;
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

    window.addEventListener('scroll', onScroll);
    onScroll();
}
