import { AuthError } from '../../core/errors.js';

/** ObtenerDestinatarios — Espejo de ComposeMensajeViewModel.fetchRecipients() */
export class ObtenerDestinatarios {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    async ejecutar(sesion) {
        if (!sesion?.userId || !sesion?.userType) {
            throw new AuthError('Sesión de usuario no encontrada.');
        }
        return this.mensajeRepository.listarDestinatarios(sesion.userId, sesion.userType);
    }
}
