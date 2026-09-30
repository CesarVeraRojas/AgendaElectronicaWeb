import { noImplementado } from './_contract.js';

/** Circulares del jardín (BL-70). */
export class CircularRepository {
    /**
     * Las que puede ver quien tiene la sesión, por páginas.
     * @returns {Promise<import('../entities/Circular.js').PaginaDeCirculares>}
     */
    listar({ antesDe = null } = {})  { noImplementado('CircularRepository', 'listar'); }
    /** @returns {Promise<import('../entities/Circular.js').Circular>} */
    publicar(nuevaCircular)          { noImplementado('CircularRepository', 'publicar'); }
    /** @returns {Promise<void>} */
    eliminar(circularId)             { noImplementado('CircularRepository', 'eliminar'); }
    /** @returns {Promise<void>} */
    marcarLeida(circularId)          { noImplementado('CircularRepository', 'marcarLeida'); }
    /** @returns {Promise<import('../entities/Circular.js').LecturaDeCircular>} */
    lectura(circularId)              { noImplementado('CircularRepository', 'lectura'); }
}
