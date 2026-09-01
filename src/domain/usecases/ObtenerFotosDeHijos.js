import { AuthError } from '../../core/errors.js';

/** ObtenerFotosDeHijos — Espejo de FotosHijoViewModel.fetchFotos() */
export class ObtenerFotosDeHijos {
    constructor({ fotoRepository }) {
        this.fotoRepository = fotoRepository;
    }

    async ejecutar(sesion) {
        if (!sesion?.userId) throw new AuthError('No se pudo obtener el ID del padre.');
        return this.fotoRepository.listarPorPadre(sesion.userId);
    }
}
