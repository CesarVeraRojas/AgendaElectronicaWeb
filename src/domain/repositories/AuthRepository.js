import { noImplementado } from './_contract.js';

export class AuthRepository {
    /**
     * @returns {Promise<import('../entities/Sesion.js').Sesion>}
     * @throws {ServerError} credenciales incorrectas
     */
    iniciarSesion(email, password) { noImplementado('AuthRepository', 'iniciarSesion'); }

    /**
     * Invalida el token en el servidor. No lanza: cerrar sesión tiene que
     * funcionar aunque no haya red.
     * @returns {Promise<void>}
     */
    cerrarSesion() { noImplementado('AuthRepository', 'cerrarSesion'); }
}
