import { SesionRepository } from '../../domain/repositories/SesionRepository.js';
import { Sesion }           from '../../domain/entities/Sesion.js';
import { Config }           from '../../core/config.js';

/**
 * Implementación del contrato de sesión sobre localStorage.
 * Espejo de UserSessionManager.kt, pero persistente entre recargas
 * (Android lo guarda sólo en memoria).
 */
export class SesionRepositoryImpl extends SesionRepository {
    constructor({ localStorageDataSource }) {
        super();
        this.storage = localStorageDataSource;
    }

    obtener() {
        const datos = this.storage.leer(Config.SESSION_KEY);
        if (!datos) return null;
        const sesion = new Sesion(datos);
        return sesion.estaAutenticada ? sesion : null;
    }

    guardar(sesion) {
        this.storage.escribir(Config.SESSION_KEY, {
            userType:  sesion.userType,
            userId:    sesion.userId,
            colegioId: sesion.colegioId,
            nombres:   sesion.nombres,
            apellidos: sesion.apellidos,
            email:     sesion.email,
        });
    }

    limpiar() {
        this.storage.borrar(Config.SESSION_KEY);
    }
}
