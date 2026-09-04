/**
 * ui.js — Componentes visuales reutilizables.
 * Espejo de los composables compartidos de Android:
 *   TopAppBar, Card, SectionCard, InfoRow, CircularProgressIndicator,
 *   Toast (aquí: snackbar), y los estados vacíos.
 *
 * Todos devuelven cadenas HTML ya escapadas.
 */
import { html, esc, crudo } from './html.js';

/** Espejo de TopAppBar con botón de volver y acciones. */
export function topBar({ titulo, volverA = null, acciones = [] }) {
    const btnVolver = volverA
        ? `<button class="topbar__icon" data-volver="${esc(volverA)}" aria-label="Volver">
               <span class="material-icons">arrow_back</span>
           </button>`
        : '';

    const btnAcciones = acciones.map(a => `
        <button class="topbar__icon" id="${esc(a.id)}" title="${esc(a.titulo)}" aria-label="${esc(a.titulo)}">
            <span class="material-icons">${esc(a.icono)}</span>
        </button>`).join('');

    return html`
        <header class="topbar">
            ${crudo(btnVolver)}
            <h1 class="topbar__title">${titulo}</h1>
            <div class="topbar__actions">${crudo(btnAcciones)}</div>
        </header>`;
}

/** Espejo de Card + SectionCard (título en color primario). */
export function seccion(titulo, contenidoHtml) {
    return html`
        <section class="card card--section">
            ${titulo ? crudo(`<h2 class="card__title">${esc(titulo)}</h2>`) : ''}
            <div class="card__body">${crudo(contenidoHtml)}</div>
        </section>`;
}

/** Espejo de InfoRow: etiqueta a la izquierda, valor a la derecha. */
export function filaInfo(etiqueta, valor) {
    return html`
        <div class="info-row">
            <span class="info-row__label">${etiqueta}</span>
            <span class="info-row__value">${valor ?? 'No especificado'}</span>
        </div>`;
}

/** Espejo de CircularProgressIndicator. */
export function spinner(texto = 'Cargando…') {
    return html`
        <div class="loading" role="status" aria-live="polite">
            <div class="spinner"></div>
            <p class="loading__text">${texto}</p>
        </div>`;
}

/** Estado vacío / sin resultados. */
export function estadoVacio(mensaje, icono = 'inbox') {
    return html`
        <div class="empty-state">
            <span class="material-icons empty-state__icon">${icono}</span>
            <p>${mensaje}</p>
        </div>`;
}

/** Bloque de error dentro de la página. */
export function bloqueError(mensaje) {
    return html`
        <div class="alert alert--error" role="alert">
            <span class="material-icons">error_outline</span>
            <span>${mensaje}</span>
        </div>`;
}

/** Campo de texto. Espejo de OutlinedTextField. */
export function campoTexto({ id, etiqueta, tipo = 'text', valor = '', requerido = false, placeholder = '', deshabilitado = false }) {
    return html`
        <div class="field">
            <label class="field__label" for="${id}">${etiqueta}${requerido ? ' *' : ''}</label>
            <input class="field__input" type="${tipo}" id="${id}" name="${id}"
                   value="${valor}" placeholder="${placeholder}"
                   ${crudo(requerido ? 'required' : '')} ${crudo(deshabilitado ? 'disabled' : '')} />
        </div>`;
}

/** Área de texto. Espejo de OutlinedTextField multilínea. */
export function campoArea({ id, etiqueta, valor = '', filas = 5, placeholder = '', requerido = false }) {
    return html`
        <div class="field">
            <label class="field__label" for="${id}">${etiqueta}${requerido ? ' *' : ''}</label>
            <textarea class="field__input field__input--area" id="${id}" name="${id}"
                      rows="${filas}" placeholder="${placeholder}"
                      ${crudo(requerido ? 'required' : '')}>${valor}</textarea>
        </div>`;
}

/**
 * Desplegable. Espejo de ExposedDropdownMenuBox.
 * @param {Array<{valor:string,etiqueta:string}>} opciones
 */
export function campoSelect({ id, etiqueta, opciones = [], valor = '', placeholder = 'Seleccione…', deshabilitado = false, requerido = false }) {
    const items = opciones.map(o => {
        const v = typeof o === 'string' ? o : o.valor;
        const t = typeof o === 'string' ? o : o.etiqueta;
        return `<option value="${esc(v)}"${String(v) === String(valor) ? ' selected' : ''}>${esc(t)}</option>`;
    }).join('');

    return html`
        <div class="field">
            <label class="field__label" for="${id}">${etiqueta}${requerido ? ' *' : ''}</label>
            <select class="field__input field__select" id="${id}" name="${id}" ${crudo(deshabilitado ? 'disabled' : '')}>
                ${placeholder ? crudo(`<option value="">${esc(placeholder)}</option>`) : ''}
                ${crudo(items)}
            </select>
        </div>`;
}

/** Botón principal. Espejo de Button de ancho completo. */
export function botonPrimario({ id, texto, icono = null, deshabilitado = false, ancho = true }) {
    return html`
        <button class="btn btn--primary${ancho ? ' btn--block' : ''}" id="${id}" ${crudo(deshabilitado ? 'disabled' : '')}>
            ${icono ? crudo(`<span class="material-icons">${esc(icono)}</span>`) : ''}
            <span class="btn__label">${texto}</span>
        </button>`;
}

/** Botón secundario. Espejo de OutlinedButton. */
export function botonSecundario({ id, texto, icono = null, deshabilitado = false, ancho = false }) {
    return html`
        <button class="btn btn--outlined${ancho ? ' btn--block' : ''}" id="${id}" ${crudo(deshabilitado ? 'disabled' : '')}>
            ${icono ? crudo(`<span class="material-icons">${esc(icono)}</span>`) : ''}
            <span class="btn__label">${texto}</span>
        </button>`;
}

/** Grupo de radios. Espejo de SingleChoiceSubSection. */
export function grupoRadios({ nombre, opciones, seleccion = null, subtitulo = '' }) {
    const items = opciones.map((op, i) => {
        const id = `${nombre}-${i}`;
        return `
            <label class="choice" for="${esc(id)}">
                <input type="radio" id="${esc(id)}" name="${esc(nombre)}" value="${esc(op)}"
                       ${String(op) === String(seleccion) ? 'checked' : ''} />
                <span>${esc(op)}</span>
            </label>`;
    }).join('');

    return html`
        <div class="choice-group">
            ${subtitulo ? crudo(`<p class="choice-group__subtitle">${esc(subtitulo)}</p>`) : ''}
            <div class="choice-group__items">${crudo(items)}</div>
        </div>`;
}

/** Grupo de casillas. Espejo de MultiChoiceSubSection (2 columnas). */
export function grupoCheckboxes({ nombre, opciones, seleccionadas = [] }) {
    const items = opciones.map((op, i) => {
        const id = `${nombre}-${i}`;
        return `
            <label class="choice" for="${esc(id)}">
                <input type="checkbox" id="${esc(id)}" name="${esc(nombre)}" value="${esc(op)}"
                       ${seleccionadas.includes(op) ? 'checked' : ''} />
                <span>${esc(op)}</span>
            </label>`;
    }).join('');

    return html`<div class="choice-group choice-group--grid">${crudo(items)}</div>`;
}
