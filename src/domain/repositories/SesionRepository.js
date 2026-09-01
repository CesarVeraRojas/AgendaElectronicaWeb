import { noImplementado } from './_contract.js';

/**
 * Contrato de persistencia de la sesión.
 * El dominio no sabe si detrás hay localStorage, una cookie o memoria.
 * Espejo del rol que cumple UserSessionManager.kt en Android.
 */
export class SesionRepository {
    /** @returns {import('../entities/Sesion.js').Sesion|null} */
    obtener()          { noImplementado('SesionRepository', 'obtener'); }
    /** @param {import('../entities/Sesion.js').Sesion} sesion */
    guardar(sesion)    { noImplementado('SesionRepository', 'guardar'); }
    limpiar()          { noImplementado('SesionRepository', 'limpiar'); }
}
