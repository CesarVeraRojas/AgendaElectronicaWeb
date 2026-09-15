/**
 * CerrarSesion — Espejo de UserSessionManager.clearSession()
 *
 * Desde BL-22 avisa además al servidor para que borre el token, que es lo que
 * hace que cerrar sesión sirva de algo: sin eso, el token seguiría valiendo.
 * El orden importa — primero el servidor, que necesita el token para
 * identificar la sesión, y sólo después se borra lo local.
 */
export class CerrarSesion {
    constructor({ sesionRepository, authRepository }) {
        this.sesionRepository = sesionRepository;
        this.authRepository = authRepository;
    }

    async ejecutar() {
        await this.authRepository.cerrarSesion();
        this.sesionRepository.limpiar();
    }
}
