/**
 * html.js — Utilidades de construcción segura de HTML.
 *
 * REGLA DEL PROYECTO: todo dato que venga del servidor o del usuario se
 * interpola con esc(). Nombres, asuntos y mensajes los escriben personas y
 * llegan sin sanear desde el backend PHP; sin escapado, un asunto con
 * <img onerror=...> ejecutaría código en el navegador de quien lo lea.
 *
 * Corresponde a BL-27 (A05 Injection) del backlog.
 */

/** Escapa los cinco caracteres peligrosos en contexto HTML. */
export function esc(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Escapa para usar dentro de un atributo entre comillas dobles. */
export function escAttr(valor) {
    return esc(valor);
}

/**
 * Tag de plantilla que escapa automáticamente cada interpolación.
 * Uso: html`<p>${nombreDelUsuario}</p>`
 *
 * Para insertar HTML ya construido y confiable (por ejemplo el resultado de
 * otro componente), envolverlo con crudo().
 */
const MARCA_CRUDO = Symbol('crudo');

export function crudo(cadenaHtml) {
    return { [MARCA_CRUDO]: true, valor: String(cadenaHtml) };
}

export function html(literales, ...valores) {
    return literales.reduce((acc, literal, i) => {
        if (i === 0) return literal;
        const v = valores[i - 1];
        let pieza;
        if (v && v[MARCA_CRUDO]) {
            pieza = v.valor;
        } else if (Array.isArray(v)) {
            // Los arrays se unen; cada elemento sigue la misma regla
            pieza = v.map(x => (x && x[MARCA_CRUDO]) ? x.valor : esc(x)).join('');
        } else {
            pieza = esc(v);
        }
        return acc + pieza + literal;
    }, '');
}
