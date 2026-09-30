import { noImplementado } from './_contract.js';

/** Jardines clientes de AgendaKids, para soporte (BL-74). */
export class JardinRepository {
    /** @returns {Promise<import('../entities/Jardin.js').Jardin[]>} */
    listar()          { noImplementado('JardinRepository', 'listar'); }
    /** @returns {Promise<{jardin:{id,nombre}, director:{id,nombre,email}, logoEsperado:string}>} */
    darDeAlta(nuevo)  { noImplementado('JardinRepository', 'darDeAlta'); }
}
