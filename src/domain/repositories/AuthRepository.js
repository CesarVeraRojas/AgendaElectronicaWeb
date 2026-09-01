import { noImplementado } from './_contract.js';

export class AuthRepository {
    /**
     * @returns {Promise<import('../entities/Sesion.js').Sesion>}
     * @throws {ServerError} credenciales incorrectas
     */
    iniciarSesion(email, password) { noImplementado('AuthRepository', 'iniciarSesion'); }
}
