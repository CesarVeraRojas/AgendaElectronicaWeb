import { NuevaObservacion } from '../entities/Observacion.js';
import { AuthError, ValidationError } from '../../core/errors.js';

/** GuardarObservacion — Espejo de ObservacionesViewModel.guardarObservacion() */
export class GuardarObservacion {
    constructor({ observacionRepository }) {
        this.observacionRepository = observacionRepository;
    }

    async ejecutar({ sesion, estudianteId, texto }) {
        if (!sesion?.userId) {
            throw new AuthError('No se pudo obtener el ID del usuario para registrar la observación.');
        }
        if (!estudianteId || !texto?.trim()) {
            throw new ValidationError('Seleccione un estudiante y escriba una observación.');
        }

        await this.observacionRepository.crear(new NuevaObservacion({
            estudianteId,
            profesionalId: sesion.userId,
            observacion:   texto.trim(),
        }));

        return 'Observación guardada con éxito.';
    }
}
