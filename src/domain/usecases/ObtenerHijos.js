import { AuthError } from '../../core/errors.js';

/** ObtenerHijos — Espejo de fetchHijos(), repetido en los 3 ViewModels de padre. */
export class ObtenerHijos {
    constructor({ estudianteRepository }) {
        this.estudianteRepository = estudianteRepository;
    }

    async ejecutar(sesion) {
        if (!sesion?.userId) throw new AuthError('ID de padre no disponible.');
        return this.estudianteRepository.listarPorPadre(sesion.userId);
    }
}
