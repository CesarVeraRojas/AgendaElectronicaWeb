import { ValidationError, AuthError } from '../../core/errors.js';

/** EnviarMensaje — Espejo de ComposeMensajeViewModel.onSendMensaje() */
export class EnviarMensaje {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    async ejecutar(sesion, nuevoMensaje) {
        if (!sesion?.userId || !sesion?.userType) throw new AuthError();
        if (!nuevoMensaje.esValido()) {
            throw new ValidationError('Por favor, complete todos los campos obligatorios.');
        }
        await this.mensajeRepository.enviar(nuevoMensaje, sesion);
        return 'Mensaje enviado con éxito.';
    }
}
