/** Observacion — Espejo de data.Observacion y data.ObservacionRequest */
export class Observacion {
    constructor({ id, observacion, fecha, tipo = null, profesionalNombre = null }) {
        this.id                = id;
        this.observacion       = observacion;
        this.fecha             = fecha;
        this.tipo              = tipo;
        this.profesionalNombre = profesionalNombre;
    }
}

export class NuevaObservacion {
    constructor({ estudianteId, profesionalId, observacion, tipo = null, visiblePadre = 1 }) {
        this.estudianteId  = estudianteId;
        this.profesionalId = profesionalId;
        this.observacion   = observacion;
        this.tipo          = tipo;
        this.visiblePadre  = visiblePadre;
    }
}
