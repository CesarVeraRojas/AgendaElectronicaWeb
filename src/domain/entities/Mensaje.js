/** Mensaje — Espejo de data.Mensaje, data.UsuarioMensaje y data.EnviarMensajeRequest */

export const Bandeja = {
    RECIBIDOS: 'recibidos',
    ENVIADOS:  'enviados',
};

export class Mensaje {
    constructor({
        id, remitenteId, remitenteType, destinatarioId, destinatarioType,
        asunto, mensaje, fechaEnvio, leido,
        remitenteNombre = null, destinatarioNombre = null, adjuntoUrl = null,
    }) {
        this.id                 = id;
        this.remitenteId        = remitenteId;
        this.remitenteType      = remitenteType;
        this.destinatarioId     = destinatarioId;
        this.destinatarioType   = destinatarioType;
        this.asunto             = asunto;
        this.mensaje            = mensaje;
        this.fechaEnvio         = fechaEnvio;
        this.leido              = leido;
        this.remitenteNombre    = remitenteNombre;
        this.destinatarioNombre = destinatarioNombre;
        this.adjuntoUrl         = adjuntoUrl;
    }

    /** Regla de MensajesScreen.kt: sólo los recibidos se marcan como no leídos. */
    esNoLeido(enBandejaRecibidos) {
        return Boolean(enBandejaRecibidos) && Number(this.leido) === 0;
    }

    tieneAdjunto() {
        return Boolean(this.adjuntoUrl);
    }

    /** En la bandeja de Enviados: si el destinatario de esta fila ya lo abrió. */
    leidoPorDestinatario() {
        return Number(this.leido) === 1;
    }
}

/**
 * Estado de lectura de un destinatario de un envío.
 *
 * El backend guarda una fila por destinatario, así que un mensaje enviado a
 * tres personas tiene tres estados independientes.
 */
export class DestinatarioLectura {
    constructor({ mensajeId, destinatarioId, destinatarioType, nombre, leido }) {
        this.mensajeId        = mensajeId;
        this.destinatarioId   = destinatarioId;
        this.destinatarioType = destinatarioType;
        this.nombre           = nombre;
        this.leido            = leido;
    }

    /** `leido` llega del PHP como 0/1, a veces en forma de cadena. */
    haLeido() {
        return Number(this.leido) === 1;
    }
}

/** Cuántos de los destinatarios han leído el mensaje. */
export function resumirLectura(destinatarios = []) {
    const total  = destinatarios.length;
    const leidos = destinatarios.filter(d => d.haLeido()).length;
    return {
        total,
        leidos,
        pendientes:  total - leidos,
        todosLeidos: total > 0 && leidos === total,
    };
}

export class UsuarioMensaje {
    constructor({ id, userType, displayName }) {
        this.id          = id;
        this.userType    = userType;
        this.displayName = displayName;
    }
}

export class NuevoMensaje {
    constructor({ destinatarios = [], asunto = '', mensaje = '', adjunto = null }) {
        this.destinatarios = destinatarios;   // UsuarioMensaje[]
        this.asunto        = asunto;
        this.mensaje       = mensaje;
        this.adjunto       = adjunto;         // File | null
    }

    /** Regla de ComposeMensajeViewModel.onSendMensaje() */
    esValido() {
        return this.destinatarios.length > 0 &&
               this.asunto.trim()  !== '' &&
               this.mensaje.trim() !== '';
    }

    tieneAdjunto() {
        return this.adjunto instanceof File || (this.adjunto && this.adjunto.name);
    }
}
