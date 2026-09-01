import { AuthError, ValidationError } from '../../core/errors.js';

/** CrearGrupo — Espejo de CrearGrupoViewModel.crearGrupo() */
export class CrearGrupo {
    constructor({ grupoRepository }) {
        this.grupoRepository = grupoRepository;
    }

    async ejecutar({ sesion, nombreGrupo, descripcion }) {
        if (!nombreGrupo?.trim()) {
            throw new ValidationError('El nombre del grupo es obligatorio.');
        }
        if (!sesion?.colegioId) {
            throw new AuthError('No se encontró el colegio del director.');
        }

        await this.grupoRepository.crear({
            colegioId:   sesion.colegioId,
            nombreGrupo: nombreGrupo.trim(),
            descripcion: descripcion?.trim() || null,
        });

        return 'Grupo creado con éxito.';
    }
}
