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
        totalDestinatarios = null, totalLeidos = null,
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
        // Cuentas del envío al que pertenece la fila. Sólo llegan en la bandeja
        // de Enviados, que devuelve una tarjeta por envío y no por destinatario.
        this.totalDestinatarios = totalDestinatarios;
        this.totalLeidos        = totalLeidos;
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

    /**
     * A cuánta gente se envió. Un mensaje anterior a la agrupación, o uno
     * recibido, no trae la cuenta: entonces la fila se representa a sí misma.
     */
    get numeroDestinatarios() {
        const n = Number(this.totalDestinatarios);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }

    esEnvioMultiple() {
        return this.numeroDestinatarios > 1;
    }

    /** Para la tarjeta de Enviados: "Luisa Peña" o "Luisa Peña y 4 más". */
    resumenDestinatarios() {
        const nombre = this.destinatarioNombre ?? 'Desconocido';
        const otros  = this.numeroDestinatarios - 1;
        return otros > 0 ? `${nombre} y ${otros} más` : nombre;
    }

    /**
     * Cuántos han abierto el mensaje, contando todo el envío.
     *
     * El ausente se comprueba antes de convertir: `Number(null)` es cero, así
     * que preguntar sólo por `Number.isFinite` daría "nadie lo ha leído" a un
     * mensaje sin la cuenta, que es justo lo contrario de caer al dato de la fila.
     */
    get numeroLeidos() {
        if (this.totalLeidos === null || this.totalLeidos === undefined) {
            return this.leidoPorDestinatario() ? 1 : 0;
        }
        const n = Number(this.totalLeidos);
        return Number.isFinite(n) ? n : 0;
    }

    /** Texto del acuse en la tarjeta de Enviados. */
    resumenAcuse() {
        return textoLectura({ total: this.numeroDestinatarios, leidos: this.numeroLeidos });
    }

    /** El icono sólo se marca cuando lo han leído todos. */
    todosHanLeido() {
        return this.numeroLeidos >= this.numeroDestinatarios;
    }
}

/**
 * Qué poner en el campo "Para" al redactar. Con pocos destinatarios se nombran;
 * con muchos, la lista de nombres se vuelve ilegible y se dice cuántos son,
 * igual que hace el detalle de un mensaje enviado.
 */
export function textoDestinatarios(destinatarios = [], maximoNombres = 3) {
    if (!destinatarios.length)                  return '';
    if (destinatarios.length <= maximoNombres)  return destinatarios.map(d => d.displayName).join(', ');
    return `${destinatarios.length} destinatarios`;
}

/**
 * Lo que se le dice al director tras tocar un grupo. Está aquí, y no en la
 * pantalla, para que la web y Android digan exactamente lo mismo, y para poder
 * fijar las palabras con una prueba.
 *
 * Los dos casos vacíos se explican en vez de no hacer nada: un grupo sin
 * acudientes y un grupo cuyos acudientes ya estaban todos marcados se ven igual
 * desde fuera, y sin aviso parecen un fallo.
 */
export function textoMarcadoDeGrupo({ nombreGrupo, nuevos, totalGrupo, totalSeleccionados }) {
    if (totalGrupo === 0) {
        return `El grupo ${nombreGrupo} no tiene acudientes registrados, así que no se marcó a nadie.`;
    }
    if (nuevos === 0) {
        return `Los ${totalGrupo} acudientes de ${nombreGrupo} ya estaban marcados.`;
    }
    return `Marcados ${nuevos} acudientes de ${nombreGrupo}. ` +
           `En total hay ${totalSeleccionados} destinatarios seleccionados.`;
}

/**
 * Texto del acuse de lectura, en un solo sitio porque lo usan la tarjeta de la
 * bandeja y la sección de estado del detalle. Con un único destinatario el
 * recuento sobra: basta con decir si lo leyó.
 */
export function textoLectura({ total, leidos }) {
    if (total <= 1)      return leidos >= 1 ? 'Leído' : 'Sin leer';
    if (leidos >= total) return `Leído por todos (${total})`;
    return `Leído por ${leidos} de ${total}`;
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
