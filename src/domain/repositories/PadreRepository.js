import { noImplementado } from './_contract.js';

export class PadreRepository {
    /** @returns {Promise<Padre[]>} acudientes del colegio del usuario autenticado */
    listar()                  { noImplementado('PadreRepository', 'listar'); }
    /** @returns {Promise<Padre>} ficha recién leída, para no editar sobre datos rancios */
    obtener(id)               { noImplementado('PadreRepository', 'obtener'); }
    /** @param {object} cambios sólo los campos modificados @returns {Promise<void>} */
    actualizar(id, cambios)   { noImplementado('PadreRepository', 'actualizar'); }
}
