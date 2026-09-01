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
        return aSesion(json);
    }
}
