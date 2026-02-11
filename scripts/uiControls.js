// UI control functions
import { state } from './state.js';

export function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (state.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
    }
}

export function toggleThemePanel() {
    const panel = document.getElementById('theme-panel');
    panel.classList.toggle('open');
}

export function closeThemePanel() {
    document.getElementById('theme-panel').classList.remove('open');
}

export function toggleRawMode(FileManager) {
    state.rawMode = !state.rawMode;
    const btn = document.getElementById('toggle-raw-btn');
    
    if (state.rawMode) {
        btn.innerHTML = '<i class="fas fa-eye"></i> Rendered';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '<i class="fas fa-code"></i> Raw';
        btn.classList.remove('active');
    }

    if (state.currentFileId) {
        const file = FileManager.getFile(state.currentFileId);
        if (file) {
            FileManager.showFile(file);
        }
    }
}

export function showPasteModal() {
    const modal = document.getElementById('paste-modal');
    modal.classList.add('show');
}

export function closePasteModal() {
    const modal = document.getElementById('paste-modal');
    modal.classList.remove('show');
    document.getElementById('file-name-input').value = '';
    document.getElementById('markdown-input').value = '';
}

export function autoDetectTitle(content) {
    if (!content || !content.trim()) {
        return 'Untitled';
    }
    
    const lines = content.trim().split('\n');
    
    // Look for first H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match && h1Match[1]) {
        return sanitizeFilename(h1Match[1].trim());
    }
    
    // Look for first H2 heading
    const h2Match = content.match(/^##\s+(.+)$/m);
    if (h2Match && h2Match[1]) {
        return sanitizeFilename(h2Match[1].trim());
    }
    
    // Use first non-empty line if reasonably short
    const firstLine = lines.find(line => line.trim().length > 0);
    if (firstLine && firstLine.trim().length <= 60) {
        const cleaned = firstLine.trim()
            .replace(/^#+\s*/, '')
            .replace(/[*_~`]/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        
        if (cleaned.length > 0 && cleaned.length <= 60) {
            return sanitizeFilename(cleaned);
        }
    }
    
    // Take first few words
    const words = content.trim()
        .replace(/^#+\s*/, '')
        .replace(/[*_~`#]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0)
        .slice(0, 5)
        .join(' ');
    
    if (words) {
        return sanitizeFilename(words);
    }
    
    return 'Untitled';
}

export function sanitizeFilename(name) {
    return name
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .substring(0, 100)
        || 'untitled';
}

export function addPastedContent(FileManager) {
    const nameInput = document.getElementById('file-name-input');
    const contentInput = document.getElementById('markdown-input');
    
    const manualName = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('Please enter some markdown content');
        return;
    }

    const name = manualName || autoDetectTitle(content);
    
    const fileId = FileManager.addFile(name, content);
    FileManager.selectFile(fileId);
    closePasteModal();
}

export function initializeDragAndDrop(FileManager) {
    const dragArea = document.getElementById('drag-drop-area');
    const body = document.body;

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, preventDefaults, false);
        dragArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        body.addEventListener(eventName, () => dragArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, () => dragArea.classList.remove('drag-over'), false);
    });

    const handleDrop = (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files, FileManager);
    };

    body.addEventListener('drop', handleDrop, false);
    dragArea.addEventListener('drop', handleDrop, false);
}

export function handleFiles(fileList, FileManager) {
    Array.from(fileList).forEach(file => {
        if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Strip .md and .markdown extensions from filename
                const fileName = file.name
                    .replace(/\.md$/i, '')
                    .replace(/\.markdown$/i, '');
                const fileId = FileManager.addFile(fileName, e.target.result);
                FileManager.selectFile(fileId);
            };
            reader.readAsText(file);
        }
    });
}



// Add Document Modal functions
let selectedFile = null;

export function showAddDocumentModal() {
    const modal = document.getElementById('add-document-modal');
    modal.classList.add('show');
    
    // Reset form
    const pasteInput = document.getElementById('paste-markdown-input');
    const titleInput = document.getElementById('document-title-input');
    pasteInput.value = '';
    titleInput.value = '';
    titleInput.dataset.userEdited = '';
    clearSelectedFile();
    
    // Focus the paste textarea
    setTimeout(() => {
        pasteInput.focus();
    }, 100);
}

export function closeAddDocumentModal() {
    const modal = document.getElementById('add-document-modal');
    modal.classList.remove('show');
    selectedFile = null;
}

export function handleModalFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    selectedFile = file;
    
    // Show file info
    document.getElementById('file-drop-zone').style.display = 'none';
    document.getElementById('selected-file-info').style.display = 'flex';
    document.getElementById('selected-file-name').textContent = file.name;
    
    // Read file and auto-generate title
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        const titleInput = document.getElementById('document-title-input');
        
        if (!titleInput.dataset.userEdited) {
            // Strip .md and .markdown extensions from filename
            const fileName = file.name
                .replace(/\.md$/i, '')
                .replace(/\.markdown$/i, '');
            titleInput.value = fileName;
        }
        
        // Store content for later use
        selectedFile.content = content;
    };
    reader.readAsText(file);
}

export function clearSelectedFile() {
    selectedFile = null;
    document.getElementById('file-drop-zone').style.display = 'flex';
    document.getElementById('selected-file-info').style.display = 'none';
    document.getElementById('file-input').value = '';
}

export function createDocumentFromModal(FileManager) {
    const pastedContent = document.getElementById('paste-markdown-input').value.trim();
    const titleInput = document.getElementById('document-title-input');
    let title = titleInput.value.trim();
    let content = '';
    
    // Determine content source
    if (pastedContent) {
        content = pastedContent;
        if (!title) {
            title = autoDetectTitle(content);
        }
    } else if (selectedFile && selectedFile.content) {
        content = selectedFile.content;
        if (!title) {
            title = selectedFile.name
                .replace(/\.md$/i, '')
                .replace(/\.markdown$/i, '');
        }
    } else {
        alert('Please paste markdown content or select a file');
        return;
    }
    
    if (!content) {
        alert('No content provided');
        return;
    }
    
    // Create the document
    const fileId = FileManager.addFile(title, content);
    FileManager.selectFile(fileId);
    closeAddDocumentModal();
}
