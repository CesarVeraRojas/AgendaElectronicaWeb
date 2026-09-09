/**
 * Asistencia — Espejo de data.AsistenciaRequest.
 * Los tres estados son los que registra AsistenciaScreen.kt.
 */
export const EstadoAsistencia = {
    ASISTIO: 'ASISTIO',
    TARDE:   'TARDE',
    AUSENTE: 'AUSENTE',
};

export const ETIQUETAS_ASISTENCIA = [
    { valor: EstadoAsistencia.ASISTIO, etiqueta: 'Asistio' },
    { valor: EstadoAsistencia.TARDE,   etiqueta: 'Tarde'   },
    { valor: EstadoAsistencia.AUSENTE, etiqueta: 'Ausente' },
];

/** Etiqueta legible de un estado, para pintarlo sin exponer el código de la BD. */
export function etiquetaDeEstado(estado) {
    return ETIQUETAS_ASISTENCIA.find(op => op.valor === estado)?.etiqueta ?? estado ?? '';
}

export class RegistroAsistencia {
    constructor({ estudianteId, fecha, estado, registradoPor }) {
        this.estudianteId  = estudianteId;
        this.fecha         = fecha;   // "YYYY-MM-DD"
        this.estado        = estado;
        this.registradoPor = registradoPor;
    }
}

/**
 * AsistenciaRegistrada — un día ya guardado, tal como lo consulta el padre.
 * Lo que registra el profesional es RegistroAsistencia; esto es sólo lectura.
 */
export class AsistenciaRegistrada {
    constructor({ id, fecha, estado, profesionalNombre }) {
        this.id                = id;
        this.fecha             = fecha;   // "YYYY-MM-DD"
        this.estado            = estado;
        this.profesionalNombre = profesionalNombre ?? null;
    }

    get etiquetaEstado() {
        return etiquetaDeEstado(this.estado);
    }
}

/** Cuenta los días de cada estado en una lista de AsistenciaRegistrada. */
export function resumirAsistencia(lista = []) {
    const resumen = { asistio: 0, tarde: 0, ausente: 0, total: 0 };
    for (const registro of lista) {
        if (registro?.estado === EstadoAsistencia.ASISTIO)      resumen.asistio++;
        else if (registro?.estado === EstadoAsistencia.TARDE)   resumen.tarde++;
        else if (registro?.estado === EstadoAsistencia.AUSENTE) resumen.ausente++;
        else continue;
        resumen.total++;
    }
    return resumen;
}
