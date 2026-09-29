import { noImplementado } from './_contract.js';

export class FotoRepository {
    /** @returns {Promise<void>} */
    subir(estudianteId, archivo) { noImplementado('FotoRepository', 'subir'); }
    /** @returns {Promise<FotosDeHijo[]>} */
    listarPorPadre(padreId)      { noImplementado('FotoRepository', 'listarPorPadre'); }
    /**
     * Galería del director (BL-60).
     * @param {{grupoId:?number, estudianteId:?number, antesDe:?number}} filtro
     * @returns {Promise<import('../entities/FotoDelColegio.js').PaginaDeFotos>}
     */
    listarDelColegio(filtro)     { noImplementado('FotoRepository', 'listarDelColegio'); }
    /** @returns {Promise<void>} */
    eliminar(fotoId)             { noImplementado('FotoRepository', 'eliminar'); }
}
