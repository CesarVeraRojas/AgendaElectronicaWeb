/**
 * AgendaApiDataSource — Los endpoints del backend, uno a uno.
 * Espejo de: network/ApiService.kt
 *
 * Sólo traduce llamadas a rutas. No mapea a entidades (de eso se encargan los
 * repositorios con los mappers de dto/) ni contiene reglas de negocio.
 */
export class AgendaApiDataSource {
    constructor({ httpClient }) {
        this.http = httpClient;
    }

    // ── Autenticación ───────────────────────────────────────────
    login(email, password) {
        return this.http.post('login.php', { email, password });
    }

    // ── Grupos ──────────────────────────────────────────────────
    getGrupos(colegioId)                { return this.http.get('grupos.php', colegioId != null ? { colegio_id: colegioId } : {}); }
    getGruposPorProfesional(profId)     { return this.http.get('get_grupos_por_profesional.php', { profesional_id: profId }); }
    crearGrupo(grupo)                   { return this.http.post('grupos.php', grupo); }

    // ── Estudiantes ─────────────────────────────────────────────
    getEstudiantesPorGrupo(grupoId)     { return this.http.get('estudiantes_por_grupo.php', { grupo_id: grupoId }); }
    getEstudiantesPorPadre(padreId)     { return this.http.get('get_estudiantes_por_padre.php', { padre_id: padreId }); }
    crearEstudiante(estudiante)         { return this.http.post('agregar_estudiante.php', estudiante); }
    crearPadre(padre)                   { return this.http.post('agregar_padre.php', padre); }
    asignarPadres(asignacion)           { return this.http.post('estudiante_padre.php', asignacion); }
    asignarGrupo(asignacion)            { return this.http.post('asignar_estudiante_grupo.php', asignacion); }

    // ── Profesionales ───────────────────────────────────────────
    getProfesionales(colegioId)         { return this.http.get('listar_profesionales.php', colegioId != null ? { colegio_id: colegioId } : {}); }
    crearProfesional(profesional)       { return this.http.post('crear_profesional.php', profesional); }
    asignarGruposAProfesional(asig)     { return this.http.post('asignar_profesional_grupo.php', asig); }

    // ── Asistencia ──────────────────────────────────────────────
    crearAsistencia(asistencia)         { return this.http.post('crear_asistencia.php', asistencia); }

    // ── Observaciones ───────────────────────────────────────────
    crearObservacion(obs)               { return this.http.post('crear_observacion.php', obs); }
    getObservacionesPorHijo(estId)      { return this.http.get('get_observaciones_por_hijo.php', { estudiante_id: estId }); }

    // ── Agenda diaria ───────────────────────────────────────────
    guardarAgendaDiaria(agenda)         { return this.http.post('agenda_diaria.php', agenda); }
    getAgendaDiaria(estId, fecha)       { return this.http.get('agenda_diaria.php', { estudiante_id: estId, fecha }); }

    // ── Fotos ───────────────────────────────────────────────────
    /** Android usa subir_foto_estudiante.php (ver FotosViewModel.kt:119). */
    subirFotoEstudiante(estudianteId, archivo) {
        const fd = new FormData();
        fd.append('estudiante_id', estudianteId);
        fd.append('foto', archivo, archivo.name);
        return this.http.postMultipart('subir_foto_estudiante.php', fd);
    }
    getFotosPorHijo(padreId)            { return this.http.get('get_fotos_por_hijo.php', { padre_id: padreId }); }

    // ── Mensajería ──────────────────────────────────────────────
    getUsuariosParaMensajes(uid, tipo)  { return this.http.get('get_usuarios_para_mensajes.php', { user_id: uid, user_type: tipo }); }
    getMensajes(uid, tipo, folder)      { return this.http.get('get_mensajes.php', { user_id: uid, user_type: tipo, folder }); }
    enviarMensaje(request)              { return this.http.post('enviar_mensaje.php', request); }

    /** Envío con adjunto. Espejo de enviarMensajeMultipart en ApiService.kt */
    enviarMensajeMultipart({ destinatariosJson, asunto, mensaje, adjunto }) {
        const fd = new FormData();
        fd.append('destinatarios_json', destinatariosJson);
        fd.append('asunto', asunto);
        fd.append('mensaje', mensaje);
        if (adjunto) fd.append('adjunto', adjunto, adjunto.name);
        return this.http.postMultipart('enviar_mensaje.php', fd);
    }

    marcarMensajeLeido(mensajeId)       { return this.http.post('marcar_mensaje_leido.php', { mensaje_id: mensajeId }); }

    // ── Colegio ─────────────────────────────────────────────────
    getColegioDetails(colegioId)        { return this.http.get('get_colegio_details.php', { colegio_id: colegioId }); }
}
