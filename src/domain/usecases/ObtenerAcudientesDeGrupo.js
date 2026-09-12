import { Rol }                          from '../entities/Sesion.js';
import { AuthError, ValidationError }   from '../../core/errors.js';

/**
 * ObtenerAcudientesDeGrupo — Las familias de un grupo, para que el director
 * pueda escribirles a todas sin ir marcándolas una a una (BL-54).
 *
 * Sólo el director. Un profesional no lo necesita: su lista de destinatarios ya
 * son, exactamente, los acudientes de los grupos que tiene asignados.
 *
 * Devuelve destinatarios, no envía nada: la pantalla marca con ellos las
 * casillas que ya tiene, de modo que el director ve a quién le va a llegar
 * antes de mandarlo.
 */
export class ObtenerAcudientesDeGrupo {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    /** Si la pantalla debe ofrecer el atajo de grupos. */
    disponiblePara(sesion) {
        return sesion?.userType === Rol.DIRECTOR;
    }

    async ejecutar(sesion, grupoId) {
        if (!sesion?.userId || !sesion?.userType) throw new AuthError();
        if (!this.disponiblePara(sesion)) {
            throw new AuthError('Sólo el director puede escribir a un grupo completo.');
        }
        if (grupoId === null || grupoId === undefined || grupoId === '') {
            throw new ValidationError('Falta indicar el grupo.');
        }
        return this.mensajeRepository.listarAcudientesDeGrupo(grupoId);
    }
}
