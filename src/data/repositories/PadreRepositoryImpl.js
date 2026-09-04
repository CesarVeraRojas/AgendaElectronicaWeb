import { PadreRepository } from '../../domain/repositories/PadreRepository.js';
import { comoLista, aPadre, desdeCambiosPadre } from '../dto/mappers.js';

export class PadreRepositoryImpl extends PadreRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar() {
        return comoLista(await this.api.getPadres()).map(aPadre);
    }

    async obtener(id) {
        const json = await this.api.getPadre(id);
        // obtener_padre.php pasa por respondWithSuccess(), que fusiona la clave
        // en la raíz en vez de anidarla bajo "data".
        return aPadre(json?.padre ?? json?.data ?? json);
    }

    async actualizar(id, cambios) {
        await this.api.actualizarPadre({
            id_padre_a_actualizar: id,
            ...desdeCambiosPadre(cambios),
        });
    }
}
