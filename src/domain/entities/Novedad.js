/**
 * Novedad — Algo que ha pasado y de lo que hay que avisar.
 * Espejo de la respuesta de get_novedades.php.
 */

export const TipoNovedad = {
    MENSAJE:     'mensaje',
    OBSERVACION: 'observacion',
    AGENDA:      'agenda',
};

/** A qué pantalla lleva cada tipo de aviso. */
const RUTA_POR_TIPO = {
    [TipoNovedad.MENSAJE]:     'mensajes',
    [TipoNovedad.OBSERVACION]: 'observaciones-hijo',
    [TipoNovedad.AGENDA]:      'agenda-diaria-hijo',
};

export class Novedad {
    constructor({ tipo, clave, titulo, texto, fecha, referenciaId, estudianteId, estudianteNombre }) {
        this.tipo             = tipo;
        this.clave            = clave;
        this.titulo           = titulo;
        this.texto            = texto;
        this.fecha            = fecha;
        this.referenciaId     = referenciaId;
        this.estudianteId     = estudianteId ?? null;
        this.estudianteNombre = estudianteNombre ?? null;
    }

    /** Pantalla que hay que abrir al pulsar el aviso. */
    rutaDestino() {
        return RUTA_POR_TIPO[this.tipo] ?? 'menu';
    }
}

/**
 * Descarta las novedades de las que ya se avisó.
 *
 * Hace falta aunque el servidor filtre por fecha: la agenda diaria se actualiza
 * varias veces al día y vuelve a aparecer con cada retoque. Su clave es el niño
 * y el día, así que se avisa una sola vez.
 */
export function filtrarNoAvisadas(novedades = [], clavesAvisadas = []) {
    const vistas = new Set(clavesAvisadas);
    return novedades.filter(n => !vistas.has(n.clave));
}

/**
 * Mantiene la lista de claves acotada: sólo importan las recientes, porque el
 * servidor ya filtra por fecha.
 */
export function recortarClaves(claves = [], max = 200) {
    return claves.length <= max ? [...claves] : claves.slice(claves.length - max);
}

/** Texto del contador del menú. */
export function textoContador(cantidad) {
    if (cantidad <= 0)  return 'Sin novedades';
    if (cantidad === 1) return '1 novedad';
    return `${cantidad} novedades`;
}
