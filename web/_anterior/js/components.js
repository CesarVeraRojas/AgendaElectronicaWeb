/**
 * components.js — Shared UI render helpers
 * Mirrors: ui/common/SharedComposables.kt
 *
 * Each function returns an HTML string that gets injected into the DOM.
 * This mirrors how Composable functions return UI trees in Jetpack Compose.
 */

// ============================================================
// TOP APP BAR  (mirrors TopAppBar)
// ============================================================

/**
 * Renders the sticky top app bar.
 *
 * @param {Object}  opts
 * @param {string}  opts.title       - Bar title text
 * @param {boolean} [opts.showBack]  - Show back arrow button (id="btn-back")
 * @param {Array}   [opts.actions]   - Array of { id, icon, label } for action buttons
 */
export function renderTopBar({ title, showBack = false, actions = [] }) {
    const backBtn = showBack ? `
        <button class="top-app-bar__btn" id="btn-back" aria-label="Volver">
            <span class="material-icons">arrow_back</span>
        </button>` : '';

    const actionBtns = actions.map(a => `
        <button class="top-app-bar__btn" id="${a.id}" aria-label="${a.label ?? a.icon}">
            <span class="material-icons">${a.icon}</span>
        </button>`).join('');

    return `
        <header class="top-app-bar">
            ${backBtn}
            <h1 class="top-app-bar__title">${title}</h1>
            ${actionBtns}
        </header>`;
}

// ============================================================
// PROGRESS INDICATORS
// ============================================================

/** Renders a full-width LinearProgressIndicator (shown while loading) */
export function renderLinearProgress() {
    return `<div class="linear-progress"><div class="linear-progress__bar"></div></div>`;
}

/** Shows or hides the linear progress bar by id */
export function setLoading(progressId, visible) {
    const el = document.getElementById(progressId);
    if (el) el.style.display = visible ? 'block' : 'none';
}

// ============================================================
// ALERT / ERROR  (mirrors error Text in Compose)
// ============================================================

/**
 * Renders an alert box.
 * @param {string} message - Alert text (empty string renders nothing)
 * @param {'error'|'success'|'info'} [type]
 */
export function renderAlert(message, type = 'error') {
    if (!message) return '';
    const icons = { error: 'error_outline', success: 'check_circle', info: 'info' };
    return `
        <div class="alert alert--${type}" role="alert">
            <span class="material-icons" style="font-size:18px;flex-shrink:0">${icons[type] ?? 'info'}</span>
            <span>${message}</span>
        </div>`;
}

/** Updates an existing alert element in place (avoids full re-render) */
export function setAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = renderAlert(message, type);
}

// ============================================================
// EMPTY STATE  (mirrors empty list state pattern)
// ============================================================

/**
 * Renders the empty-state placeholder (icon + message).
 * @param {string} message
 * @param {string} [icon]  - Material icon name
 */
export function renderEmptyState(message, icon = 'inbox') {
    return `
        <div class="empty-state">
            <span class="material-icons">${icon}</span>
            <p>${message}</p>
        </div>`;
}

// ============================================================
// TEXT FIELDS  (mirrors OutlinedTextField)
// ============================================================

/**
 * Renders an outlined text input.
 */
export function renderTextField({
    id, label, type = 'text', value = '',
    placeholder = '', required = false, disabled = false, hint = ''
}) {
    return `
        <div class="text-field">
            <label class="text-field__label" for="${id}">${label}${required ? ' *' : ''}</label>
            <input
                class="text-field__input"
                id="${id}" name="${id}"
                type="${type}"
                value="${escHtml(String(value))}"
                placeholder="${escHtml(placeholder)}"
                ${required  ? 'required'  : ''}
                ${disabled  ? 'disabled'  : ''}
                autocomplete="off"
            />
            ${hint ? `<span class="text-field__hint">${hint}</span>` : ''}
        </div>`;
}

/**
 * Renders a <select> dropdown.
 * Mirrors: AutoCompleteTextView / ExposedDropdownMenu in Android.
 *
 * @param {Array<string|{value,label}>} opts.options
 */
export function renderSelectField({ id, label, options = [], value = '', required = false, disabled = false }) {
    const optionsHtml = options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const t = typeof o === 'string' ? o : o.label;
        return `<option value="${escHtml(v)}" ${v === String(value) ? 'selected' : ''}>${escHtml(t)}</option>`;
    }).join('');

    return `
        <div class="text-field">
            <label class="text-field__label" for="${id}">${label}${required ? ' *' : ''}</label>
            <div class="text-field__select-wrap">
                <select class="text-field__select" id="${id}" name="${id}"
                    ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>
                    <option value="">Seleccionar...</option>
                    ${optionsHtml}
                </select>
            </div>
        </div>`;
}

/**
 * Renders a <textarea> field.
 */
export function renderTextareaField({ id, label, value = '', placeholder = '', required = false, rows = 4 }) {
    return `
        <div class="text-field">
            <label class="text-field__label" for="${id}">${label}${required ? ' *' : ''}</label>
            <textarea
                class="text-field__textarea"
                id="${id}" name="${id}"
                placeholder="${escHtml(placeholder)}"
                rows="${rows}"
                ${required ? 'required' : ''}
            >${escHtml(String(value))}</textarea>
        </div>`;
}

// ============================================================
// LIGHTBOX  (mirrors the full-screen photo dialog for Padre)
// ============================================================

/** Renders the hidden lightbox overlay (add once per page that needs it) */
export function renderLightbox() {
    return `
        <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Vista de foto">
            <button class="lightbox__close" id="lightbox-close" aria-label="Cerrar">
                <span class="material-icons">close</span>
            </button>
            <img class="lightbox__img" id="lightbox-img" src="" alt="Foto ampliada" />
            <a class="lightbox__download" id="lightbox-download" href="#" download>
                <span class="material-icons">download</span>
                Descargar
            </a>
        </div>`;
}

/**
 * Opens the lightbox with the given image.
 * Mirrors: the onClick that triggers fullscreen in FotosHijoScreen.
 */
export function openLightbox(src, filename = 'foto') {
    const lb  = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const dl  = document.getElementById('lightbox-download');
    if (!lb) return;
    img.src      = src;
    dl.href      = src;
    dl.download  = filename;
    lb.classList.add('lightbox--open');

    const close = () => { lb.classList.remove('lightbox--open'); };
    document.getElementById('lightbox-close').onclick = close;
    lb.onclick = (e) => { if (e.target === lb) close(); };
}

// ============================================================
// DATE FORMATTING  (mirrors the date display in FotosHijoScreen)
// ============================================================

/**
 * "2026-03-09" → "9 de marzo de 2026"
 * Mirrors: the readable date format used in the Fotos screen.
 */
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * "2026-03-09 14:30:00" → "9 mar 2026, 2:30 p.m."
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ============================================================
// SECURITY HELPER
// ============================================================

/** Escapes HTML special characters to prevent XSS */
export function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
