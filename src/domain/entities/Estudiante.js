/**
 * Estudiante — Espejo de data.EstudianteAsistencia y data.Estudiante.
 */
export class Estudiante {
    constructor({ id, nombres, apellidos, colegioId = null }) {
        this.id        = id;
        this.nombres   = nombres;
        this.apellidos = apellidos;
        this.colegioId = colegioId;
    }

    /** Espejo de EstudianteAsistencia.nombreCompleto */
    get nombreCompleto() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }
}

/** Datos completos para dar de alta un estudiante. Espejo de data.Estudiante. */
export class NuevoEstudiante {
    constructor(datos) {
        Object.assign(this, datos);
    }
}

/** Espejo de data.Padre — el acudiente que se crea junto al estudiante. */
export class Acudiente {
    constructor(datos) {
        Object.assign(this, datos);
    }

    /** Un acudiente sólo cuenta si TODOS sus campos vienen llenos (regla de CrearEstudianteActivity). */
    estaCompleto() {
        const requeridos = [
            'tipoDocumento', 'documento', 'nombres', 'apellidos',
            'parentesco', 'telefono', 'direccion', 'email', 'password',
        ];
        return requeridos.every(c => String(this[c] ?? '').trim() !== '');
    }
}
