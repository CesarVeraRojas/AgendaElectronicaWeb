import { ValidationError } from '../../core/errors.js';
import { validarBusqueda } from '../entities/Cuenta.js';

/**
 * AtenderCuentas — Lo que hace soporte con las cuentas de los jardines
 * (2026-11-20): buscarlas, restablecer la contraseña, desactivar y reactivar.
 * Sólo en la web. El servidor sólo lo permite al rol soporte.
 */
export class AtenderCuentas {
    constructor({ cuentaRepository }) {
        this.cuentaRepository = cuentaRepository;
    }

    async buscar(q) {
        const error = validarBusqueda(q);
        if (error) throw new ValidationError(error);
        return this.cuentaRepository.buscar(String(q).trim());
    }

    restablecerContrasena(cuenta) {
        return this.cuentaRepository.restablecerContrasena(cuenta);
    }

    desactivar(cuenta) {
        return this.cuentaRepository.cambiarEstado(cuenta, false);
    }

    reactivar(cuenta) {
        return this.cuentaRepository.cambiarEstado(cuenta, true);
    }
}
