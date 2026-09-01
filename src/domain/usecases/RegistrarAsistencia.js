import { RegistroAsistencia } from '../entities/Asistencia.js';
import { AuthError, ValidationError } from '../../core/errors.js';

/**
 * RegistrarAsistencia — Espejo de AsistenciaViewModel.guardarAsistencias()
 *
 * El backend expone un endpoint por estudiante, así que se envían en secuencia
 * y el proceso se detiene en el primer fallo, igual que en Android.
 */
export class RegistrarAsistencia {
    constructor({ asistenciaRepository }) {
        this.asistenciaRepository = asistenciaRepository;
    }

    async ejecutar({ sesion, fecha, estudiantes }) {
        if (!sesion?.userId) {
            throw new AuthError('No se pudo obtener el ID del usuario para registrar la asistencia.');
        }
        if (!estudiantes?.length) {
            throw new ValidationError('Seleccione un grupo y cargue estudiantes primero.');
        }

        for (const item of estudiantes) {
            await this.asistenciaRepository.registrar(new RegistroAsistencia({
                estudianteId:  item.estudiante.id,
                fecha,
                estado:        String(item.estado).toUpperCase(),
                registradoPor: sesion.userId,
            }));
        }

        return `¡Asistencias guardadas con éxito! (${estudiantes.length})`;
    }
}
