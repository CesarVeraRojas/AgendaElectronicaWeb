/**
 * HttpClient — Cliente HTTP genérico.
 * Espejo de: network/RetrofitClient.kt (Retrofit + OkHttp + authInterceptor)
 *
 * Replica el interceptor de autenticación de Android exactamente:
 *   - GET       → user_id y user_type como query params + headers X-User-Id / X-User-Type
 *   - POST JSON → user_id y user_type inyectados en el cuerpo + headers
 *   - Multipart → sólo headers (no se puede tocar el cuerpo sin romper el boundary)
 *
 * Esta clase es el único punto del frontend que conoce `fetch`.
 */
import { Config } from '../../core/config.js';
import { ServerError, NetworkError } from '../../core/errors.js';

export class HttpClient {
    /**
     * @param {object} deps
     * @param {() => ({userId, userType}|null)} deps.proveedorDeSesion
     *        Función que devuelve la sesión actual. Se inyecta para que el
     *        cliente no dependa del repositorio de sesión ni del almacenamiento.
     */
    constructor({ proveedorDeSesion, baseUrl = Config.BASE_URL }) {
        this.proveedorDeSesion = proveedorDeSesion;
        this.baseUrl = baseUrl;
    }

    /** Cabeceras de autenticación, equivalentes al authInterceptor de RetrofitClient. */
    _authHeaders() {
        const s = this.proveedorDeSesion?.();
        if (!s?.userId) return {};
        return {
            'X-User-Id':   String(s.userId),
            'X-User-Type': String(s.userType),
        };
    }

    /** Convierte la respuesta en objeto, con errores legibles para el usuario. */
    async _procesar(res) {
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
        return this._procesar(res);
    }

    /** GET — añade user_id / user_type al query string, igual que el interceptor. */
    async get(endpoint, params = {}) {
        const s = this.proveedorDeSesion?.();
        const todos = { ...params };
        if (s?.userId) {
            todos.user_id   = s.userId;
            todos.user_type = s.userType;
        }
        // Descarta parámetros nulos para no enviar "null" literal
        Object.keys(todos).forEach(k => (todos[k] === null || todos[k] === undefined) && delete todos[k]);

        const query = new URLSearchParams(todos).toString();
        const url   = this.baseUrl + endpoint + (query ? `?${query}` : '');
        return this._enviar(url, { method: 'GET', headers: this._authHeaders() });
    }

    /** POST con cuerpo JSON — inyecta user_id / user_type en el cuerpo. */
    async post(endpoint, body = {}) {
        const s = this.proveedorDeSesion?.();
        const cuerpo = { ...body };
        if (s?.userId) {
            cuerpo.user_id   = s.userId;
            cuerpo.user_type = s.userType;
        }
        return this._enviar(this.baseUrl + endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', ...this._authHeaders() },
            body:    JSON.stringify(cuerpo),
        });
    }

    /**
     * PUT con cuerpo JSON. Sólo `grupos.php` despacha por método; el resto de
     * endpoints de actualización aceptan POST. El CORS ya lo permite:
     * helpers.php envía `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`.
     */
    async put(endpoint, body = {}) {
        const s = this.proveedorDeSesion?.();
        const cuerpo = { ...body };
        if (s?.userId) {
            cuerpo.user_id   = s.userId;
            cuerpo.user_type = s.userType;
        }
        return this._enviar(this.baseUrl + endpoint, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', ...this._authHeaders() },
            body:    JSON.stringify(cuerpo),
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
