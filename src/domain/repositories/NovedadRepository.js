import { noImplementado } from './_contract.js';

export class NovedadRepository {
    /** @returns {Promise<{ahora: string, novedades: Novedad[]}>} */
    consultar(desde)              { noImplementado('NovedadRepository', 'consultar'); }
    /** @returns {string|null} Marca de tiempo devuelta por el servidor la última vez. */
    ultimaConsulta()              { noImplementado('NovedadRepository', 'ultimaConsulta'); }
    guardarUltimaConsulta(ahora)  { noImplementado('NovedadRepository', 'guardarUltimaConsulta'); }
    /** @returns {string[]} */
    clavesAvisadas()              { noImplementado('NovedadRepository', 'clavesAvisadas'); }
    guardarClavesAvisadas(claves) { noImplementado('NovedadRepository', 'guardarClavesAvisadas'); }
    olvidar()                     { noImplementado('NovedadRepository', 'olvidar'); }
}
