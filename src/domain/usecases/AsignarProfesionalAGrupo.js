import { ValidationError } from '../../core/errors.js';

/** AsignarProfesionalAGrupo — Espejo de AsignarProfesionalGrupoViewModel.asignar() */
export class AsignarProfesionalAGrupo {
    constructor({ profesionalRepository }) {
        this.profesionalRepository = profesionalRepository;
    }

    async ejecutar({ profesionalId, grupoIds }) {
        if (!profesionalId)   throw new ValidationError('Seleccione un profesional.');
        if (!grupoIds?.length) throw new ValidationError('Seleccione al menos un grupo.');

        await this.profesionalRepository.asignarAGrupos(profesionalId, grupoIds);
        return 'Asignación guardada con éxito.';
    }
}
