import { ValidationError } from '../../core/errors.js';

/**
 * IniciarSesion — Espejo de LoginViewModel.login()
 * Valida, autentica y persiste la sesión en un solo paso.
 */
export class IniciarSesion {
    constructor({ authRepository, sesionRepository }) {
        this.authRepository   = authRepository;
        this.sesionRepository = sesionRepository;
    }

    async ejecutar(email, password) {
        // Misma validación previa que hace LoginViewModel antes de llamar a la red
        if (!email?.trim() || !password?.trim()) {
            throw new ValidationError('El correo y la contraseña son obligatorios.');
        }
        const sesion = await this.authRepository.iniciarSesion(email.trim(), password);
        this.sesionRepository.guardar(sesion);
        return sesion;
    }
}
