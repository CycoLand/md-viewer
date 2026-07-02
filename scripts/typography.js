export const TYPOGRAPHY_DEFAULTS = {
    standard: { charactersPerLine: 68, lineHeight: 1.625 },
    reading: { charactersPerLine: 55, lineHeight: 1.75 }
};

export function applyTypography(charactersPerLine, lineHeight) {
    const root = document.documentElement;
    root.style.setProperty('--content-max-width', `${charactersPerLine}ch`);
    root.style.setProperty('--line-height', String(lineHeight));
}

export function syncThemeTypographyInputs(charactersPerLine, lineHeight) {
    const contentWidth = document.getElementById('content-width');
    const contentWidthValue = document.getElementById('content-width-value');
    const lineHeightInput = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');

    if (contentWidth) {
        contentWidth.value = charactersPerLine;
    }
    if (contentWidthValue) {
        contentWidthValue.textContent = `${charactersPerLine}ch`;
    }
    if (lineHeightInput) {
        lineHeightInput.value = lineHeight;
    }
    if (lineHeightValue) {
        lineHeightValue.textContent = String(lineHeight);
    }
}

export function syncReadingTypographyInputs(charactersPerLine, lineHeight) {
    const charactersInput = document.getElementById('reading-characters-per-line');
    const charactersValue = document.getElementById('reading-characters-per-line-value');
    const lineHeightInput = document.getElementById('reading-line-height');
    const lineHeightValue = document.getElementById('reading-line-height-value');

    if (charactersInput) {
        charactersInput.value = charactersPerLine;
    }
    if (charactersValue) {
        charactersValue.textContent = `${charactersPerLine}ch`;
    }
    if (lineHeightInput) {
        lineHeightInput.value = lineHeight;
    }
    if (lineHeightValue) {
        lineHeightValue.textContent = String(lineHeight);
    }
}

export function parseCharactersPerLine(value) {
    if (!value) {
        return TYPOGRAPHY_DEFAULTS.standard.charactersPerLine;
    }

    const match = String(value).match(/([\d.]+)/);
    return match ? Math.round(parseFloat(match[1])) : TYPOGRAPHY_DEFAULTS.standard.charactersPerLine;
}

export function parseLineHeight(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : TYPOGRAPHY_DEFAULTS.standard.lineHeight;
}
