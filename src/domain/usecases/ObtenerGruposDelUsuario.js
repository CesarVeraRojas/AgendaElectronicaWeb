import { Rol }        from '../entities/Sesion.js';
import { AuthError }  from '../../core/errors.js';

/**
 * ObtenerGruposDelUsuario — Regla repetida en 4 ViewModels de Android
 * (Asistencia, AgendaDiaria, Observaciones, Fotos), aquí en un solo sitio:
 *
 *   profesional → sólo los grupos que tiene asignados
 *   director    → todos los grupos de su colegio
 *   padre       → no autorizado
 */
export class ObtenerGruposDelUsuario {
    constructor({ grupoRepository }) {
        this.grupoRepository = grupoRepository;
    }

    async ejecutar(sesion) {
        if (!sesion) throw new AuthError();

        if (sesion.userType === Rol.PROFESIONAL) {
            if (!sesion.userId) throw new AuthError('ID de profesional no encontrado en la sesión.');
            return this.grupoRepository.listarPorProfesional(sesion.userId);
        }

        if (sesion.userType === Rol.DIRECTOR) {
            if (!sesion.colegioId) throw new AuthError('ID de colegio no encontrado para el director.');
            return this.grupoRepository.listarPorColegio(sesion.colegioId);
        }

        throw new AuthError('Rol no autorizado para ver grupos.');
    }
}
