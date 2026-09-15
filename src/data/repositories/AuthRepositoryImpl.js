import { AuthRepository } from '../../domain/repositories/AuthRepository.js';
import { ServerError }    from '../../core/errors.js';
import { aSesion }        from '../dto/mappers.js';

export class AuthRepositoryImpl extends AuthRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async iniciarSesion(email, password) {
        const json = await this.api.login(email, password);
        // login.php responde 401 con success:false; HttpClient ya lo convierte en ServerError.
        if (!json?.user_type || !json?.user?.id) {
            throw new ServerError(json?.message || 'Credenciales incorrectas o usuario no encontrado.');
        }
        // Sin token no hay sesión posible (BL-22). Si el servidor no lo manda es
        // que todavía tiene el PHP viejo: mejor decirlo que fallar luego en cada
        // pantalla con un 401 sin explicación.
        if (!json?.token) {
            throw new ServerError('El servidor no entregó un token de sesión. Puede que el backend no esté actualizado.');
        }
        return aSesion(json);
    }

    /**
     * Le dice al servidor que borre el token. Se traga cualquier fallo a
     * propósito: si no hay red, la sesión local debe borrarse igual, y dejar al
     * usuario dentro porque el servidor no contesta sería peor que el problema.
     */
    async cerrarSesion() {
        try {
            await this.api.cerrarSesion();
        } catch {
            // El token quedará huérfano hasta que caduque. Es aceptable.
        }
    }
}
