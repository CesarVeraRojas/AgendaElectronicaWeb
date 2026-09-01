import { AgendaDiaria } from '../entities/AgendaDiaria.js';
import { AuthError, ValidationError } from '../../core/errors.js';

/** GuardarAgendaDiaria — Espejo de AgendaDiariaViewModel.saveAgendaDiaria() */
export class GuardarAgendaDiaria {
    constructor({ agendaDiariaRepository }) {
        this.agendaDiariaRepository = agendaDiariaRepository;
    }

    async ejecutar({ sesion, estudianteId, fecha, campos }) {
        if (!sesion?.userId) throw new AuthError('Debe estar logueado para guardar la agenda.');
        if (!estudianteId)   throw new ValidationError('Debe seleccionar un niño.');

        await this.agendaDiariaRepository.guardar(new AgendaDiaria({
            estudianteId,
            profesionalId: sesion.userId,
            fecha,
            ...campos,
        }));

        return 'Agenda guardada con éxito';
    }
}
