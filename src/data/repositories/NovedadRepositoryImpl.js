import { NovedadRepository } from '../../domain/repositories/NovedadRepository.js';
import { aNovedad } from '../dto/mappers.js';

/** Claves de almacenamiento. Se borran al cerrar sesión. */
const CLAVE_ULTIMA  = 'agenda_novedades_desde';
const CLAVE_AVISADAS = 'agenda_novedades_avisadas';

export class NovedadRepositoryImpl extends NovedadRepository {
    constructor({ apiDataSource, localStorageDataSource }) {
        super();
        this.api     = apiDataSource;
        this.storage = localStorageDataSource;
    }

    async consultar(desde) {
        const respuesta = await this.api.getNovedades(desde);
        return {
            ahora:     respuesta?.ahora ?? null,
            novedades: (respuesta?.novedades ?? []).map(aNovedad),
        };
    }

    ultimaConsulta() {
        return this.storage.leer(CLAVE_ULTIMA);
    }

    guardarUltimaConsulta(ahora) {
        this.storage.escribir(CLAVE_ULTIMA, ahora);
    }

    clavesAvisadas() {
        const guardadas = this.storage.leer(CLAVE_AVISADAS);
        return Array.isArray(guardadas) ? guardadas : [];
    }

    guardarClavesAvisadas(claves) {
        this.storage.escribir(CLAVE_AVISADAS, claves);
    }

    olvidar() {
        this.storage.borrar(CLAVE_ULTIMA);
        this.storage.borrar(CLAVE_AVISADAS);
    }
}
