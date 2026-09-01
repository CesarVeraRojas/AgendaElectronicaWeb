import { AuthError } from '../../core/errors.js';

/** ObtenerProfesionales — Espejo de AsignarProfesionalGrupoViewModel.fetchProfesionales() */
export class ObtenerProfesionales {
    constructor({ profesionalRepository }) {
        this.profesionalRepository = profesionalRepository;
    }

    async ejecutar(sesion) {
        if (!sesion?.colegioId) throw new AuthError('No se encontró el colegio del director.');
        return this.profesionalRepository.listar(sesion.colegioId);
    }
}
