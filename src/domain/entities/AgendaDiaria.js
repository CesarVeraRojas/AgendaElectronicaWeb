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
