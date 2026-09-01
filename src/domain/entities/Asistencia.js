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

export class RegistroAsistencia {
    constructor({ estudianteId, fecha, estado, registradoPor }) {
        this.estudianteId  = estudianteId;
        this.fecha         = fecha;   // "YYYY-MM-DD"
        this.estado        = estado;
        this.registradoPor = registradoPor;
    }
}
