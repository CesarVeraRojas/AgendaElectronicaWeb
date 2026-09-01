/**
 * formato.js — Formateo de fechas para presentación.
 * Espejo de las funciones formatDate de FotosHijoScreen.kt y SimpleDateFormat.
 */

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Convierte "YYYY-MM-DD" o "YYYY-MM-DD HH:mm:ss" en Date, sin desfase de zona horaria. */
function aFecha(texto) {
    if (!texto) return null;
    const m = String(texto).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
}

/** "2026-03-09" → "9 de marzo de 2026" (espejo de FotosHijoScreen.formatDate) */
export function fechaLarga(texto) {
    const d = aFecha(texto);
    if (!d) return texto ?? '';
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "2026-03-09" → "09/03/2026" (espejo de SimpleDateFormat("dd/MM/yyyy")) */
export function fechaCorta(texto) {
    const d = aFecha(texto);
    if (!d) return texto ?? '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
}

/** "2026-03-09 14:30:00" → "09/03/2026 14:30" */
export function fechaHora(texto) {
    const d = aFecha(texto);
    if (!d) return texto ?? '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${fechaCorta(texto)} ${hh}:${mi}`;
}

/** Fecha de hoy en el formato que espera el backend: "YYYY-MM-DD". */
export function hoyIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
