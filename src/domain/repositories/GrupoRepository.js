import { noImplementado } from './_contract.js';

export class GrupoRepository {
    /** @returns {Promise<Grupo[]>} */
    listarPorColegio(colegioId)         { noImplementado('GrupoRepository', 'listarPorColegio'); }
    /** @returns {Promise<Grupo[]>} */
    listarPorProfesional(profesionalId) { noImplementado('GrupoRepository', 'listarPorProfesional'); }
    /** @returns {Promise<void>} */
    crear(grupo)                        { noImplementado('GrupoRepository', 'crear'); }
    /** grupos.php PUT exige nombre y descripción completos, no un diff. @returns {Promise<void>} */
    actualizar(id, datos)               { noImplementado('GrupoRepository', 'actualizar'); }
}
