import { FotoRepository } from '../../domain/repositories/FotoRepository.js';
import { comoLista, aFotosDeHijo } from '../dto/mappers.js';

export class FotoRepositoryImpl extends FotoRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async subir(estudianteId, archivo) {
        await this.api.subirFotoEstudiante(estudianteId, archivo);
    }

    async listarPorPadre(padreId) {
        return comoLista(await this.api.getFotosPorHijo(padreId)).map(aFotosDeHijo);
    }
}
