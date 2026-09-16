/**
 * ResumenColegio — Las cifras del colegio de un vistazo (BL-58).
 * Espejo de: data/ResumenColegio.kt
 *
 * La portada del director. No hay reglas de negocio que calcular —las cuentas
 * las hace el servidor— pero sí de lectura, y esas viven aquí para que el móvil
 * y la web digan lo mismo.
 */

export class AsistenciaDeHoy {
    constructor({ fecha, asistio, tarde, ausente, registros, sinRegistrar }) {
        this.fecha        = fecha ?? null;
        this.asistio      = asistio ?? 0;
        this.tarde        = tarde ?? 0;
        this.ausente      = ausente ?? 0;
        this.registros    = registros ?? 0;
        this.sinRegistrar = sinRegistrar ?? 0;
    }

    /** Hoy no ha pasado lista nadie todavía. */
    get sinEmpezar() {
        return this.registros === 0;
    }

    /** Queda gente por pasar, pero se empezó. */
    get aMedias() {
        return this.registros > 0 && this.sinRegistrar > 0;
    }
}

export class ResumenColegio {
    constructor({ colegioId, estudiantes, grupos, profesionales, acudientes, asistenciaHoy }) {
        this.colegioId     = colegioId ?? null;
        this.estudiantes   = estudiantes ?? 0;
        this.grupos        = grupos ?? 0;
        this.profesionales = profesionales ?? 0;
        this.acudientes    = acudientes ?? 0;
        this.asistenciaHoy = asistenciaHoy ?? new AsistenciaDeHoy({});
    }

    /** Un colegio sin alumnos: la portada no tiene nada que contar todavía. */
    get estaVacio() {
        return this.estudiantes === 0;
    }
}

/**
 * Qué decir sobre la asistencia de hoy.
 *
 * **El caso que importa es el de en medio**: que falten niños por pasar es lo
 * único de esta portada que el director no puede saber hoy sin entrar grupo por
 * grupo. Por eso se dice con número y no con un icono.
 */
export function textoAsistenciaHoy(asistencia, totalAlumnos) {
    if (!asistencia || totalAlumnos === 0) return 'Aún no hay alumnos registrados.';
    if (asistencia.sinEmpezar) return 'Hoy todavía no se ha tomado asistencia.';

    if (asistencia.aMedias) {
        const nombre = asistencia.sinRegistrar === 1 ? 'alumno' : 'alumnos';
        return `Faltan ${asistencia.sinRegistrar} ${nombre} por pasar lista.`;
    }

    return 'Asistencia tomada a todos los alumnos.';
}
