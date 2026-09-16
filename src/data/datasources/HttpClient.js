/**
 * HttpClient — Cliente HTTP genérico.
 * Espejo de: network/RetrofitClient.kt (Retrofit + OkHttp + authInterceptor)
 *
 * **Desde BL-22 la autenticación es un token y nada más.** Antes este cliente
 * repartía la identidad por tres sitios a la vez —cabeceras X-User-Id, query
 * string y cuerpo JSON— porque el servidor las aceptaba las tres. Eso era
 * precisamente el agujero: cualquiera podía escribir esas tres cosas.
 *
 * Ahora sólo va `Authorization: Bearer <token>`, idéntico en los cuatro
 * métodos, incluido el multipart. Es bastante menos código.
 *
 * Esta clase es el único punto del frontend que conoce `fetch`.
 */
import { Config } from '../../core/config.js';
import { ServerError, NetworkError, AuthError } from '../../core/errors.js';
import { esTokenRechazado } from '../../core/sesionExpirada.js';

export class HttpClient {
    /**
     * @param {object} deps
     * @param {() => ({userId, userType}|null)} deps.proveedorDeSesion
     *        Función que devuelve la sesión actual. Se inyecta para que el
     *        cliente no dependa del repositorio de sesión ni del almacenamiento.
     * @param {() => void} [deps.alRechazarElToken]
     *        Se llama cuando el servidor rechaza nuestro token (BL-59). Se
     *        inyecta por lo mismo: aquí no se sabe ni dónde vive la sesión ni
     *        qué pantalla hay que mostrar después.
     */
    constructor({ proveedorDeSesion, alRechazarElToken = null, baseUrl = Config.BASE_URL }) {
        this.proveedorDeSesion = proveedorDeSesion;
        this.alRechazarElToken = alRechazarElToken;
        this.baseUrl = baseUrl;
    }

    /** Cabecera de autenticación, equivalente al authInterceptor de RetrofitClient. */
    _authHeaders() {
        const token = this.proveedorDeSesion?.()?.token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /** Convierte la respuesta en objeto, con errores legibles para el usuario. */
    async _procesar(res, url, seMandoToken) {
        // Antes de mirar el cuerpo: si el servidor rechazó nuestro token, da
        // igual lo que diga: la sesión se acabó y hay que volver a entrar.
        if (esTokenRechazado(res.status, url, seMandoToken)) {
            this.alRechazarElToken?.();
            throw new AuthError();
        }

        const texto = await res.text();

        let datos = null;
        try {
            datos = texto ? JSON.parse(texto) : null;
        } catch {
            if (!res.ok) throw new ServerError(`Error del servidor (${res.status}).`, res.status);
            throw new ServerError(`Respuesta inválida del servidor: ${texto.slice(0, 120)}`, res.status);
        }

        if (!res.ok) {
            const mensaje = datos?.message || datos?.error || `Error del servidor (${res.status}).`;
            throw new ServerError(mensaje, res.status);
        }

        // El backend devuelve 200 con {success:false} en varios endpoints
        if (datos && datos.success === false) {
            throw new ServerError(datos.message || datos.error || 'La operación no se pudo completar.');
        }

        return datos;
    }

    async _enviar(url, opciones) {
        let res;
        try {
            res = await fetch(url, opciones);
        } catch (e) {
            throw new NetworkError();
        }
        const seMandoToken = Boolean(opciones?.headers?.['Authorization']);
        return this._procesar(res, url, seMandoToken);
    }

    /** GET — la identidad ya no viaja en el query string: sólo en la cabecera. */
    async get(endpoint, params = {}) {
        const todos = { ...params };
        // Descarta parámetros nulos para no enviar "null" literal
        Object.keys(todos).forEach(k => (todos[k] === null || todos[k] === undefined) && delete todos[k]);

        const query = new URLSearchParams(todos).toString();
        const url   = this.baseUrl + endpoint + (query ? `?${query}` : '');
        return this._enviar(url, { method: 'GET', headers: this._authHeaders() });
    }

    /** POST con cuerpo JSON — el cuerpo lleva sólo lo que pide el endpoint. */
    async post(endpoint, body = {}) {
        return this._enviar(this.baseUrl + endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', ...this._authHeaders() },
            body:    JSON.stringify(body),
        });
    }

    /**
     * PUT con cuerpo JSON. Sólo `grupos.php` despacha por método; el resto de
     * endpoints de actualización aceptan POST. El CORS ya lo permite:
     * helpers.php envía `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`.
     */
    async put(endpoint, body = {}) {
        return this._enviar(this.baseUrl + endpoint, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', ...this._authHeaders() },
            body:    JSON.stringify(body),
        });
    }

    /**
     * POST multipart — NO fija Content-Type a propósito:
     * el navegador debe generar el boundary.
     */
    async postMultipart(endpoint, formData) {
        return this._enviar(this.baseUrl + endpoint, {
            method:  'POST',
            headers: this._authHeaders(),
            body:    formData,
        });
    }
}
