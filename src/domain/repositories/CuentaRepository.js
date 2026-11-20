import { noImplementado } from './_contract.js';

/** Las cuentas de los jardines, para soporte (2026-11-20). */
export class CuentaRepository {
    /** @returns {Promise<{cuentas: import('../entities/Cuenta.js').Cuenta[], hayMas: boolean, puedeDesactivar: boolean}>} */
    buscar(q)                     { noImplementado('CuentaRepository', 'buscar'); }
    /** @returns {Promise<{contrasena: string, sesionesCerradas: number, activo: boolean, usuario: {nombre, email}}>} */
    restablecerContrasena(cuenta) { noImplementado('CuentaRepository', 'restablecerContrasena'); }
    /** @returns {Promise<{activo: boolean, sesionesCerradas: number}>} */
    cambiarEstado(cuenta, activo) { noImplementado('CuentaRepository', 'cambiarEstado'); }
}
