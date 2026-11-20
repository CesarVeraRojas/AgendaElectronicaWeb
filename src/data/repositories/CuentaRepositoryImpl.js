import { CuentaRepository } from '../../domain/repositories/CuentaRepository.js';
import { aCuentas, aContrasenaRestablecida, aEstadoCuenta } from '../dto/mappers.js';

export class CuentaRepositoryImpl extends CuentaRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async buscar(q) {
        return aCuentas(await this.api.buscarCuentas(q));
    }

    async restablecerContrasena(cuenta) {
        return aContrasenaRestablecida(await this.api.restablecerContrasena(cuenta.tipo, cuenta.id));
    }

    async cambiarEstado(cuenta, activo) {
        return aEstadoCuenta(await this.api.cambiarEstadoCuenta(cuenta.tipo, cuenta.id, activo));
    }
}
