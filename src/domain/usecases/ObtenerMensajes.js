import { Bandeja }   from '../entities/Mensaje.js';
import { AuthError } from '../../core/errors.js';

/** ObtenerMensajes — Espejo de MensajesViewModel.fetchMensajesRecibidos/Enviados() */
export class ObtenerMensajes {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    async ejecutar(sesion, bandeja = Bandeja.RECIBIDOS) {
        if (!sesion?.userId || !sesion?.userType) throw new AuthError('Usuario no logueado.');
        return this.mensajeRepository.listar(sesion.userId, sesion.userType, bandeja);
    }

    /** Cantidad de no leídos, para el indicador del menú. */
    contarNoLeidos(mensajes) {
        return mensajes.filter(m => m.esNoLeido(true)).length;
    }
}
