/** CerrarSesion — Espejo de UserSessionManager.clearSession() */
export class CerrarSesion {
    constructor({ sesionRepository }) {
        this.sesionRepository = sesionRepository;
    }

    ejecutar() {
        this.sesionRepository.limpiar();
    }
}
