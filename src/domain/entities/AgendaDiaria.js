/**
 * AgendaDiaria — Espejo de data.AgendaDiaria.
 * Las listas de opciones se toman literalmente de AgendaDiariaScreen.kt
 * para que web y Android guarden exactamente los mismos valores.
 */

export const OPCIONES_ALIMENTACION = ['Comió todo', 'Comió un poco', 'No comió'];
export const OPCIONES_SI_NO        = ['SI', 'NO'];

export const OPCIONES_ESTADO_ANIMO = [
    'Alegre', 'Activo', 'Feliz', 'Indispuesto', 'Saludable',
    'Un poco triste', 'Cansado', 'Enfermo', 'Comportamiento inadecuado',
];

export const OPCIONES_COMPETENCIAS = [
    'Trabajó muy bien en clase, terminó sus actividades',
    'Trabajó en clase, recibió acompañamiento',
    'Trabajó en clase, no termine mis actividades',
];

export const OPCIONES_EN_LA_CLASE = [
    'Participó Activamente',
    'Sigue instrucciones con facilidad',
    'Recibió acompañamiento',
];

export const OPCIONES_ROL_SOCIAL = [
    'Jugó con sus compañeros',
    'En ocasiones jugó con sus compañeros',
    'jugó solo',
];

export class AgendaDiaria {
    constructor({
        estudianteId, profesionalId, fecha,
        alimentacionSnackAM = null, alimentacionAlmuerzo = null, alimentacionSnackPM = null,
        controlEsfinteresMiccion = null, controlEsfinteresDeposicion = null,
        controlEsfinteresCambioPanal = null,
        estadoAnimo = [], desarrolloCompetencias = null,
        enLaClase = null, rolSocial = null, comentariosDelDia = null,
    }) {
        this.estudianteId                 = estudianteId;
        this.profesionalId                = profesionalId;
        this.fecha                        = fecha;
        this.alimentacionSnackAM          = alimentacionSnackAM;
        this.alimentacionAlmuerzo         = alimentacionAlmuerzo;
        this.alimentacionSnackPM          = alimentacionSnackPM;
        this.controlEsfinteresMiccion     = controlEsfinteresMiccion;
        this.controlEsfinteresDeposicion  = controlEsfinteresDeposicion;
        this.controlEsfinteresCambioPanal = controlEsfinteresCambioPanal;
        this.estadoAnimo                  = estadoAnimo ?? [];
        this.desarrolloCompetencias       = desarrolloCompetencias;
        this.enLaClase                    = enLaClase;
        this.rolSocial                    = rolSocial;
        this.comentariosDelDia            = comentariosDelDia;
    }

    /** True si el profesional no registró absolutamente nada ese día. */
    estaVacia() {
        return !this.alimentacionSnackAM && !this.alimentacionAlmuerzo &&
               !this.alimentacionSnackPM && !this.controlEsfinteresMiccion &&
               !this.controlEsfinteresDeposicion && !this.controlEsfinteresCambioPanal &&
               this.estadoAnimo.length === 0 && !this.desarrolloCompetencias &&
               !this.enLaClase && !this.rolSocial && !this.comentariosDelDia;
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   Histórico semanal (BL-57)

   Las reglas viven aquí y no en la pantalla porque la semana se ve en la web y
   en Android, y tiene que empezar el mismo día en las dos.
   ══════════════════════════════════════════════════════════════════════════ */

function dos(n) {
    return String(n).padStart(2, '0');
}

/**
 * La semana que contiene esa fecha, **de lunes a domingo**.
 *
 * Lunes y no domingo: es como se habla de la semana en el colegio, y el fin de
 * semana queda junto al final en vez de partido entre dos semanas.
 *
 * Se calcula con Date.UTC para no arrastrar el desfase horario del navegador:
 * con horario local, un lunes a las 00:00 en un huso negativo cae en domingo.
 */
export function rangoDeLaSemana(fechaIso) {
    const [anio, mes, dia] = String(fechaIso).split('-').map(Number);
    const referencia = new Date(Date.UTC(anio, mes - 1, dia));

    // getUTCDay(): 0 es domingo. Para que la semana empiece en lunes, el domingo
    // cuenta como el séptimo día y no como el primero.
    const diaDeLaSemana = referencia.getUTCDay();
    const desplazamiento = diaDeLaSemana === 0 ? 6 : diaDeLaSemana - 1;

    const lunes = new Date(referencia);
    lunes.setUTCDate(referencia.getUTCDate() - desplazamiento);

    const domingo = new Date(lunes);
    domingo.setUTCDate(lunes.getUTCDate() + 6);

    const texto = (d) => `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
    return { desde: texto(lunes), hasta: texto(domingo) };
}

/** Los siete días de esa semana, haya agenda o no. */
export function diasDeLaSemana(fechaIso) {
    const { desde } = rangoDeLaSemana(fechaIso);
    const [anio, mes, dia] = desde.split('-').map(Number);

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.UTC(anio, mes - 1, dia + i));
        return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
    });
}

export const NOMBRES_DE_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Nombre del día de una fecha ISO, con la semana empezando en lunes. */
export function nombreDelDia(fechaIso) {
    const [anio, mes, dia] = String(fechaIso).split('-').map(Number);
    const diaDeLaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
    return NOMBRES_DE_DIA[diaDeLaSemana === 0 ? 6 : diaDeLaSemana - 1];
}

/**
 * Cruza los siete días con las agendas que haya, para que la semana se vea
 * entera y los huecos se vean como huecos.
 *
 * Un día sin agenda **no se esconde**: que no la haya es información para la
 * familia, y una lista con tres tarjetas sueltas no dice si faltan cuatro días
 * o si la semana tenía tres.
 */
export function semanaConHuecos(fechaIso, agendas = []) {
    const porFecha = new Map(agendas.filter(Boolean).map(a => [a.fecha, a]));
    return diasDeLaSemana(fechaIso).map(fecha => ({
        fecha,
        nombre: nombreDelDia(fecha),
        agenda: porFecha.get(fecha) ?? null,
    }));
}

/** Una línea que resuma el día en la lista de la semana. */
export function resumenDelDia(agenda) {
    if (!agenda) return 'Sin agenda';

    const partes = [];
    if (agenda.estadoAnimo && agenda.estadoAnimo.length) partes.push(agenda.estadoAnimo.join(', '));
    if (agenda.alimentacionAlmuerzo) partes.push(`Almuerzo: ${agenda.alimentacionAlmuerzo}`);

    return partes.length ? partes.join(' · ') : 'Registrada, sin detalles';
}
