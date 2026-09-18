import { Rol }       from '../entities/Sesion.js';
import { AuthError } from '../../core/errors.js';

/**
 * ObtenerGruposDeProfesional — Los grupos que YA tiene asignados un profesional
 * concreto, para que el director los vea marcados antes de tocar nada.
 *
 * Existe porque `asignar_profesional_grupo.php` **sustituye** las asignaciones:
 * borra todas las del profesional e inserta las recibidas. Con la pantalla
 * arrancando en blanco, un director que quería añadir un grupo borraba el que
 * el profesional ya tenía, sin aviso ninguno.
 *
 * No confundir con ObtenerGruposDelUsuario, que devuelve los grupos de QUIEN
 * tiene la sesión abierta. Aquí el director pregunta por los de otra persona.
 */
export class ObtenerGruposDeProfesional {
    constructor({ grupoRepository }) {
        this.grupoRepository = grupoRepository;
    }

    async ejecutar(sesion, profesionalId) {
        if (!sesion) throw new AuthError();
        if (sesion.userType !== Rol.DIRECTOR) {
            throw new AuthError('Sólo el director puede consultar los grupos de un profesional.');
        }
        if (!profesionalId) return [];

        return this.grupoRepository.listarPorProfesional(profesionalId);
    }
}
