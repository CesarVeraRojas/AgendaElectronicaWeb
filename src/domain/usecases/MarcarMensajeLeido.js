/**
 * MarcarMensajeLeido — Espejo de MensajeDetailViewModel.marcarComoLeido()
 *
 * Igual que en Android, si falla no se interrumpe la lectura del mensaje:
 * el usuario ya lo está viendo. El fallo se reporta pero no se propaga.
 */
export class MarcarMensajeLeido {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    async ejecutar(mensaje) {
        if (!mensaje || Number(mensaje.leido) !== 0) return false;
        try {
            await this.mensajeRepository.marcarLeido(mensaje.id);
            return true;
        } catch (e) {
            console.error('No se pudo marcar el mensaje como leído:', e);
            return false;
        }
    }
}
