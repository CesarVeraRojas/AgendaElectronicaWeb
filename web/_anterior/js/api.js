/**
 * api.js — REST API layer
 * Mirrors: network/ApiService.kt + network/RetrofitClient.kt
 *
 * Replicates the auth interceptor from RetrofitClient exactly:
 *   - GET  → appends user_id & user_type as query params + X-User-Id / X-User-Type headers
 *   - POST (JSON) → injects user_id & user_type into the request body + headers
 *   - Multipart → headers only (FormData boundary must not be overridden)
 */

import { Auth } from './auth.js';

const BASE_URL = 'https://kindergartenhappychildren.com/api/agenda/';

// --- Internal helpers ---

/** Builds the auth headers equivalent to RetrofitClient's authInterceptor */
function authHeaders() {
    const s = Auth.getSession();
    if (!s?.userId) return {};
    return {
        'X-User-Id':   String(s.userId),
        'X-User-Type': s.userType,
    };
}

/** Parses response, throwing a meaningful error on non-OK or invalid JSON */
async function handleResponse(res) {
    if (!res.ok) {
        throw new Error(`Error del servidor (${res.status}): ${res.statusText}`);
    }
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Respuesta inválida del servidor: ${text.slice(0, 120)}`);
    }
}

/**
 * GET request — mirrors @GET Retrofit annotations.
 * Appends user_id + user_type to query string (same as interceptor for GET).
 */
async function get(endpoint, params = {}) {
    const s = Auth.getSession();
    const allParams = { ...params };
    if (s?.userId) {
        allParams.user_id   = s.userId;
        allParams.user_type = s.userType;
    }
    const query = new URLSearchParams(allParams).toString();
    const url   = BASE_URL + endpoint + (query ? '?' + query : '');
    const res   = await fetch(url, { headers: authHeaders() });
    return handleResponse(res);
}

/**
 * POST with JSON body — mirrors @POST + @Body Retrofit annotations.
 * Injects user_id + user_type into the body (same as interceptor for POST JSON).
 */
async function post(endpoint, body = {}) {
    const s = Auth.getSession();
    const fullBody = { ...body };
    if (s?.userId) {
        fullBody.user_id   = s.userId;
        fullBody.user_type = s.userType;
    }
    const res = await fetch(BASE_URL + endpoint, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(fullBody),
    });
    return handleResponse(res);
}

/**
 * POST with FormData — mirrors @Multipart + @POST Retrofit annotations.
 * Does NOT set Content-Type (browser sets it automatically with the correct boundary).
 * Auth is sent via headers only (cannot inject into multipart body generically).
 */
async function postMultipart(endpoint, formData) {
    const res = await fetch(BASE_URL + endpoint, {
        method:  'POST',
        headers: authHeaders(),
        body:    formData,
    });
    return handleResponse(res);
}

// --- Public API (mirrors ApiService interface) ---

export const Api = {

    // ── Authentication ──────────────────────────────────────────────
    /** @POST login.php — no auth injection needed (user not logged in yet) */
    login: (email, password) =>
        post('login.php', { email, password }),

    // ── Grupos ──────────────────────────────────────────────────────
    /** @GET grupos.php */
    getGrupos: (colegioId) =>
        get('grupos.php', colegioId != null ? { colegio_id: colegioId } : {}),

    /** @GET get_grupos_por_profesional.php */
    getGruposPorProfesional: (profesionalId) =>
        get('get_grupos_por_profesional.php', { profesional_id: profesionalId }),

    /** @POST grupos.php */
    crearGrupo: (grupo) =>
        post('grupos.php', grupo),

    // ── Estudiantes ─────────────────────────────────────────────────
    /** @POST agregar_estudiante.php */
    crearEstudiante: (estudiante) =>
        post('agregar_estudiante.php', estudiante),

    /** @GET obtener_estudiantes.php */
    obtenerEstudiantes: () =>
        get('obtener_estudiantes.php'),

    /** @GET estudiantes_por_grupo.php */
    getEstudiantesPorGrupo: (grupoId) =>
        get('estudiantes_por_grupo.php', { grupo_id: grupoId }),

    /** @GET get_estudiantes_por_padre.php */
    getEstudiantesPorPadre: (padreId) =>
        get('get_estudiantes_por_padre.php', { padre_id: padreId }),

    // ── Padres ──────────────────────────────────────────────────────
    /** @POST agregar_padre.php */
    crearPadre: (padre) =>
        post('agregar_padre.php', padre),

    /** @POST estudiante_padre.php */
    asignarPadres: (asignacion) =>
        post('estudiante_padre.php', asignacion),

    // ── Asignaciones ────────────────────────────────────────────────
    /** @POST asignar_estudiante_grupo.php */
    asignarGrupo: (asignacion) =>
        post('asignar_estudiante_grupo.php', asignacion),

    /** @POST asignar_profesional_grupo.php */
    asignarGruposAProfesional: (asignacion) =>
        post('asignar_profesional_grupo.php', asignacion),

    // ── Profesionales ───────────────────────────────────────────────
    /** @POST crear_profesional.php */
    crearProfesional: (profesional) =>
        post('crear_profesional.php', profesional),

    /** @GET listar_profesionales.php */
    getProfesionales: (colegioId) =>
        get('listar_profesionales.php', colegioId != null ? { colegio_id: colegioId } : {}),

    // ── Asistencia ──────────────────────────────────────────────────
    /** @POST crear_asistencia.php */
    crearAsistencia: (asistencia) =>
        post('crear_asistencia.php', asistencia),

    // ── Observaciones ───────────────────────────────────────────────
    /** @POST crear_observacion.php */
    crearObservacion: (obs) =>
        post('crear_observacion.php', obs),

    /** @GET get_observaciones_por_hijo.php */
    getObservacionesPorHijo: (estudianteId) =>
        get('get_observaciones_por_hijo.php', { estudiante_id: estudianteId }),

    // ── Agenda Diaria ───────────────────────────────────────────────
    /** @POST agenda_diaria.php */
    guardarAgendaDiaria: (agenda) =>
        post('agenda_diaria.php', agenda),

    /** @GET agenda_diaria.php */
    getAgendaDiaria: (estudianteId, fecha) =>
        get('agenda_diaria.php', { estudiante_id: estudianteId, fecha }),

    // ── Fotos ───────────────────────────────────────────────────────
    /** @Multipart @POST subir_foto.php */
    subirFoto: (estudianteId, file) => {
        const fd = new FormData();
        fd.append('estudiante_id', estudianteId);
        fd.append('foto', file, file.name);
        return postMultipart('subir_foto.php', fd);
    },

    /** @Multipart @POST subir_foto_estudiante.php */
    subirFotoEstudiante: (estudianteId, file) => {
        const fd = new FormData();
        fd.append('estudiante_id', estudianteId);
        fd.append('foto', file, file.name);
        return postMultipart('subir_foto_estudiante.php', fd);
    },

    /** @GET get_fotos_por_hijo.php */
    getFotosPorHijo: (padreId) =>
        get('get_fotos_por_hijo.php', { padre_id: padreId }),

    // ── Mensajería ──────────────────────────────────────────────────
    /** @GET get_usuarios_para_mensajes.php */
    getUsuariosParaMensajes: (userId, userType) =>
        get('get_usuarios_para_mensajes.php', { user_id: userId, user_type: userType }),

    /** @GET get_mensajes.php */
    getMensajes: (userId, userType, folder) =>
        get('get_mensajes.php', { user_id: userId, user_type: userType, folder }),

    /** @POST enviar_mensaje.php (JSON, no adjunto) */
    enviarMensaje: (request) =>
        post('enviar_mensaje.php', request),

    /**
     * @Multipart @POST enviar_mensaje.php (con adjunto opcional)
     * Mirrors the enviarMensajeMultipart endpoint in ApiService
     */
    enviarMensajeMultipart: (destinatariosJson, asunto, mensaje, adjunto = null) => {
        const fd = new FormData();
        fd.append('destinatarios_json', destinatariosJson);
        fd.append('asunto', asunto);
        fd.append('mensaje', mensaje);
        if (adjunto) fd.append('adjunto', adjunto, adjunto.name);
        return postMultipart('enviar_mensaje.php', fd);
    },

    /** @POST marcar_mensaje_leido.php */
    marcarMensajeLeido: (mensajeId) =>
        post('marcar_mensaje_leido.php', { mensaje_id: mensajeId }),

    // ── Colegio ─────────────────────────────────────────────────────
    /** @GET get_colegio_details.php */
    getColegioDetails: (colegioId) =>
        get('get_colegio_details.php', { colegio_id: colegioId }),
};
