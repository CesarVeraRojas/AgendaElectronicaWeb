/**
 * sesionExpirada.js — Qué hacer cuando el servidor rechaza el token (BL-59).
 * Espejo de: util/SesionExpirada.kt
 *
 * La web entra sola desde siempre —el guard del router manda al menú si hay
 * sesión guardada—, así que el token puede llevar muerto un mes y ya no hay una
 * pantalla de login por delante que lo descubra. Sin esto, la aplicación se
 * queda en un menú donde todas las pantallas fallan y ninguna explica por qué.
 *
 * Son dos piezas sueltas a propósito: la decisión es una función pura que se
 * prueba sin navegador, y el aviso es una suscripción para que `core` no tenga
 * que importar el router. Quien se suscribe es `main.js`, el espejo de
 * MainActivity.
 */

/** El único endpoint que responde 401 sin que la sesión tenga la culpa. */
const ENDPOINT_LOGIN = 'login.php';

/**
 * ¿Este 401 significa que nuestro token ya no vale?
 *
 * Dos exclusiones, y las dos importan:
 *
 * 1. **`login.php` responde 401 con una contraseña equivocada.** Tomarlo por una
 *    sesión caducada sería confundir "te has equivocado al escribir" con "vuelve
 *    a entrar", justo en la pantalla de entrar.
 * 2. **Si no mandamos token, el 401 no habla de nosotros.** Sólo reaccionamos a
 *    una credencial nuestra rechazada.
 *
 * Un 403 tampoco cuenta: es "tu rol no puede hacer esto", y sacar al usuario al
 * login por eso sería perderle su trabajo por nada.
 */
export function esTokenRechazado(codigo, url, seMandoToken) {
    if (codigo !== 401 || !seMandoToken) return false;

    // La URL lleva query string en los GET, así que se mira la ruta a secas.
    const ruta = String(url ?? '').split('?')[0];
    return !ruta.endsWith(ENDPOINT_LOGIN);
}

let suscriptor = null;

/** Lo registra main.js. Uno solo: es una decisión de la aplicación entera. */
export function alExpirarLaSesion(callback) {
    suscriptor = callback;
}

/** Lo llama el contenedor cuando HttpClient avisa de un token rechazado. */
export function avisarSesionExpirada() {
    if (!suscriptor) return;
    try {
        suscriptor();
    } catch (e) {
        console.error('Fallo al atender la sesión caducada:', e);
    }
}
