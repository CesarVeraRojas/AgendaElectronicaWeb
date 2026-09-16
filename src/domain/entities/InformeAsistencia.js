/**
 * InformeAsistencia — Resumen de asistencia por grupo y mes (BL-55).
 * Espejo de: data/models.kt (InformeAsistencia, FilaAlumnoInforme)
 *
 * Es el primer informe del proyecto: cuentas, no registros. Las reglas de cómo
 * se lee un porcentaje viven aquí y no en la pantalla, para que web y Android
 * digan lo mismo.
 */

/** Sin registros no es 0% de asistencia: es que no se sabe. */
export const SIN_DATOS = null;

export class FilaAlumnoInforme {
    constructor({ estudianteId, nombres, apellidos, asistio, tarde, ausente, registros, porcentajeAsistencia }) {
        this.estudianteId = estudianteId;
        this.nombres      = nombres ?? '';
        this.apellidos    = apellidos ?? '';
        this.asistio      = asistio ?? 0;
        this.tarde        = tarde ?? 0;
        this.ausente      = ausente ?? 0;
        this.registros    = registros ?? 0;
        // Llega como número; 80 y 79.5 son los dos posibles, así que nunca
        // se trata como entero.
        this.porcentajeAsistencia = porcentajeAsistencia ?? SIN_DATOS;
    }

    get nombreCompleto() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }

    /** ¿De este alumno no se sabe nada en el periodo? */
    get sinRegistros() {
        return this.registros === 0;
    }
}

export class InformeAsistencia {
    constructor({ periodo, grupo, totales, totalAlumnos, alumnos }) {
        this.periodo      = periodo ?? { anio: 0, mes: 0, desde: null, hasta: null };
        this.grupo        = grupo ?? null;          // null = el colegio entero
        this.totales      = totales ?? { asistio: 0, tarde: 0, ausente: 0, registros: 0, diasConRegistro: 0, porcentajeAsistencia: SIN_DATOS };
        this.totalAlumnos = totalAlumnos ?? 0;
        this.alumnos      = alumnos ?? [];
    }

    get estaVacio() {
        return this.alumnos.length === 0;
    }

    /** ¿Hay algún registro de asistencia en el periodo? */
    get sinRegistros() {
        return (this.totales.registros ?? 0) === 0;
    }

    get nombreDelAmbito() {
        return this.grupo ? this.grupo.nombreGrupo : 'Todo el colegio';
    }

    /** Los alumnos con más ausencias primero: es a quien hay que mirar. */
    porAusencias() {
        return [...this.alumnos].sort((a, b) => b.ausente - a.ausente
            || a.nombreCompleto.localeCompare(b.nombreCompleto));
    }
}

/**
 * Cómo se enseña un porcentaje. Sin datos no se inventa un número.
 * Un solo sitio para que las dos aplicaciones escriban lo mismo.
 */
export function textoPorcentaje(porcentaje) {
    if (porcentaje === null || porcentaje === undefined) return 'Sin datos';
    // 80 se escribe "80%", 79.5 se escribe "79.5%": nada de decimales de adorno.
    const redondeado = Math.round(porcentaje * 10) / 10;
    return `${Number.isInteger(redondeado) ? redondeado : redondeado.toFixed(1)}%`;
}

/**
 * Tres niveles para colorear la fila. Los cortes son los de la conversación con
 * el usuario: por debajo del 80% de asistencia hay que mirar al niño.
 */
export function nivelDeAsistencia(porcentaje) {
    if (porcentaje === null || porcentaje === undefined) return 'sin-datos';
    if (porcentaje >= 90) return 'bien';
    if (porcentaje >= 80) return 'regular';
    return 'bajo';
}

/** Texto del periodo para la cabecera del informe y del archivo exportado. */
export const NOMBRES_DE_MES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function textoDelPeriodo(anio, mes) {
    const nombre = NOMBRES_DE_MES[mes - 1] ?? '';
    return nombre ? `${nombre} de ${anio}` : String(anio);
}

/* ══════════════════════════════════════════════════════════════════════════
   Exportar el informe (BL-56)

   Las reglas del archivo viven aquí, no en la pantalla, porque el mismo informe
   se exporta desde la web y desde el móvil y tiene que salir idéntico. Están
   fijadas con pruebas en las dos aplicaciones.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Separador de columnas: punto y coma, no coma.
 *
 * **Excel en español parte por `;`.** Con comas, la fila entera cae en una sola
 * columna y el director ve un churro; y como los decimales van con coma
 * —también por el idioma—, usar coma de separador sería ambiguo además de
 * inútil.
 */
export const SEPARADOR_CSV = ';';

/**
 * Marca de orden de bytes. Sin ella Excel abre el archivo como Latin-1 y los
 * apellidos con tilde salen rotos. No es decorativa: es la diferencia entre
 * "Peña" y "PeÃ±a".
 */
export const BOM_UTF8 = '\uFEFF';

/** Un valor suelto, listo para meter en el CSV. */
export function campoCsv(valor) {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    // Si lleva separador, comillas o salto de línea, va entrecomillado y las
    // comillas de dentro se duplican. Es la regla del formato, y sin ella un
    // apellido con un punto y coma parte la fila en dos.
    if (texto.includes(SEPARADOR_CSV) || texto.includes('"') || /[\r\n]/.test(texto)) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

/** Un número tal y como lo espera un Excel en español: con coma decimal. */
export function numeroCsv(valor) {
    if (valor === null || valor === undefined) return '';
    const redondeado = Math.round(valor * 10) / 10;
    return String(redondeado).replace('.', ',');
}

function fila(valores) {
    return valores.map(campoCsv).join(SEPARADOR_CSV);
}

/**
 * El informe entero como texto CSV, SIN el BOM: quien lo escriba decide si lo
 * pone (la web sí, al construir el Blob; Android también, al abrir el flujo).
 *
 * Sale en el mismo orden que la pantalla —quien más falta, primero— para que lo
 * exportado sea lo que se estaba viendo.
 */
export function csvDelInforme(informe) {
    const t = informe.totales;
    const lineas = [];

    lineas.push(fila(['Informe de asistencia']));
    lineas.push(fila(['Ambito', informe.nombreDelAmbito]));
    lineas.push(fila(['Periodo', textoDelPeriodo(informe.periodo.anio, informe.periodo.mes)]));
    lineas.push(fila(['Dias con asistencia tomada', t.diasConRegistro]));
    lineas.push('');
    lineas.push(fila(['Apellidos', 'Nombres', 'Asistio', 'Tarde', 'Ausente', 'Registros', '% Asistencia']));

    for (const alumno of informe.porAusencias()) {
        lineas.push([
            campoCsv(alumno.apellidos),
            campoCsv(alumno.nombres),
            campoCsv(alumno.asistio),
            campoCsv(alumno.tarde),
            campoCsv(alumno.ausente),
            campoCsv(alumno.registros),
            // Sin datos se deja en blanco, no en 0: en una hoja de cálculo un 0
            // se promedia y miente.
            numeroCsv(alumno.porcentajeAsistencia),
        ].join(SEPARADOR_CSV));
    }

    lineas.push(fila([]));
    lineas.push([
        campoCsv('TOTAL'),
        '',
        campoCsv(t.asistio),
        campoCsv(t.tarde),
        campoCsv(t.ausente),
        campoCsv(t.registros),
        numeroCsv(t.porcentajeAsistencia),
    ].join(SEPARADOR_CSV));

    // Windows abre mejor con CRLF, y Excel es el destino de esto.
    return lineas.join('\r\n');
}

/** Nombre del archivo. Sin espacios ni tildes: viaja por correo y por WhatsApp. */
export function nombreDeArchivoCsv(informe) {
    const anio = String(informe.periodo.anio).padStart(4, '0');
    const mes  = String(informe.periodo.mes).padStart(2, '0');

    const ambito = informe.grupo
        ? informe.grupo.nombreGrupo
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // fuera tildes
            .replace(/[^A-Za-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : 'colegio';

    return `asistencia-${anio}-${mes}-${ambito || 'grupo'}.csv`;
}
