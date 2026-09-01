import { ColegioRepository } from '../../domain/repositories/ColegioRepository.js';
import { aColegio }          from '../dto/mappers.js';

export class ColegioRepositoryImpl extends ColegioRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async obtenerDetalles(colegioId) {
        const json = await this.api.getColegioDetails(colegioId);
        return aColegio(json?.data ?? json);
    }
}
