import { ColegioRepository } from '../../domain/repositories/ColegioRepository.js';
import { aColegio }          from '../dto/mappers.js';

export class ColegioRepositoryImpl extends ColegioRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async obtenerDetalles(colegioId) {
        const json = await this.api.getColegioDetails(colegioId);
        // get_colegio_details.php responde {success:true, colegio:{nombre, direccion}}:
        // respondWithSuccess() fusiona la clave en la raíz, no la anida bajo "data".
        return aColegio(json?.colegio ?? json?.data ?? json);
    }
}
