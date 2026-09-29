/**
 * FotoDelColegio — La galería del director (BL-60 y BL-61).
 * Espejo de: data/FotosDelColegio.kt
 *
 * Las reglas de lectura —cómo se agrupa por día, cómo se escribe cada día, qué
 * se dice cuando no hay nada— viven duplicadas A PROPÓSITO aquí y en Android,
 * fijadas con pruebas en los dos lados (tests/fotos-colegio.test.mjs y
 * FotosDelColegioTest.kt), para que la galería se lea igual en el móvil y en la
 * web. Si se cambia una palabra en un lado, la prueba del otro lo dice.
 */

const DIAS  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export class FotoDelColegio {
    constructor({ id, fotoUrl, fechaSubida, dia, estudianteId, estudianteNombre, grupos = [], subidoPor = null }) {
        this.id               = id;
        this.fotoUrl          = fotoUrl;
        this.fechaSubida      = fechaSubida;   // "2026-09-27 21:30:00", hora de Colombia
        this.dia              = dia;           // "2026-09-27", ya calculado por el servidor
        this.estudianteId     = estudianteId;
        this.estudianteNombre = estudianteNombre;
        this.grupos           = grupos;        // nombres, un alumno puede estar en varios
        this.subidoPor        = subidoPor;     // { tipo, nombre } o null si es anterior a BL-60
    }

    /** "21:30", la hora de subida. */
    get hora() {
        const m = String(this.fechaSubida ?? '').match(/\d{2}:\d{2}/);
        return m ? m[0] : '';
    }
}

/** Una página de la galería, tal como la devuelve fotos_colegio.php. */
export class PaginaDeFotos {
    constructor({ hoy, fotos = [], hayMas = false, siguiente = null }) {
        this.hoy       = hoy;
        this.fotos     = fotos;
        this.hayMas    = hayMas;
        this.siguiente = siguiente;
    }
}

/** Días entre dos fechas "YYYY-MM-DD", contados en UTC para que ningún huso los mueva. */
function diasEntre(desde, hasta) {
    const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10));
    const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10));
    return Math.round((b - a) / 86400000);
}

/**
 * Cómo se titula un día de la galería.
 *
 *   hoy          → "Hoy"
 *   ayer         → "Ayer"
 *   este año     → "Lunes 21 de septiembre"
 *   otro año     → "Lunes 21 de septiembre de 2025"
 *
 * `hoy` viene del servidor, no del reloj del aparato: así las dos aplicaciones
 * dicen "Hoy" del mismo día aunque el teléfono tenga la hora mal.
 */
export function textoDelDia(dia, hoy) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia ?? ''))) return String(dia ?? '');

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(hoy ?? ''))) {
        const diferencia = diasEntre(dia, hoy);
        if (diferencia === 0) return 'Hoy';
        if (diferencia === 1) return 'Ayer';
    }

    const fecha = new Date(Date.UTC(+dia.slice(0, 4), +dia.slice(5, 7) - 1, +dia.slice(8, 10)));
    const nombreDia = DIAS[fecha.getUTCDay()];
    let texto = `${nombreDia[0].toUpperCase()}${nombreDia.slice(1)} ${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]}`;
    if (hoy && String(hoy).slice(0, 4) !== dia.slice(0, 4)) texto += ` de ${dia.slice(0, 4)}`;
    return texto;
}

/**
 * Agrupa las fotos por día, conservando el orden en que llegan (de la más
 * nueva a la más vieja). Devuelve [{ dia, fotos }].
 *
 * No reordena: el orden lo decide el servidor, y una página que llega después
 * sólo puede continuar el último día o abrir uno más antiguo.
 */
export function agruparPorDia(fotos) {
    const grupos = [];
    for (const foto of fotos) {
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.dia === foto.dia) ultimo.fotos.push(foto);
        else grupos.push({ dia: foto.dia, fotos: [foto] });
    }
    return grupos;
}

/** Añade una página a lo ya cargado sin repetir ninguna foto. */
export function juntarPaginas(cargadas, nuevas) {
    const vistos = new Set(cargadas.map(f => f.id));
    return cargadas.concat(nuevas.filter(f => !vistos.has(f.id)));
}

/** Lo cargado sin la foto recién borrada. */
export function sinFoto(fotos, fotoId) {
    return fotos.filter(f => f.id !== fotoId);
}

/**
 * Quién subió la foto. Las anteriores a BL-60 no lo saben, y se dice así en
 * vez de dejar un hueco que parezca un fallo.
 */
export function textoSubidoPor(subidoPor) {
    if (!subidoPor?.nombre) return 'Sin registro de quién la subió';
    return subidoPor.tipo === 'director'
        ? `Subida por ${subidoPor.nombre} (dirección)`
        : `Subida por ${subidoPor.nombre}`;
}

/**
 * Qué decir cuando no sale ninguna foto. Un colegio sin fotos y un filtro sin
 * resultados se ven igual desde fuera, y sin explicarlo parecen un fallo.
 */
export function textoSinFotos({ grupoId = null, estudianteId = null } = {}) {
    if (estudianteId) return 'Este estudiante todavía no tiene fotos.';
    if (grupoId)      return 'Todavía no hay fotos de este grupo.';
    return 'Todavía no se ha subido ninguna foto en el colegio.';
}

/** El aviso antes de borrar: lo que pasa y que no tiene vuelta atrás. */
export const TEXTO_CONFIRMAR_ELIMINAR =
    'Las familias dejarán de verla. Esta acción no se puede deshacer.';
