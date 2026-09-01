import { GrupoRepository } from '../../domain/repositories/GrupoRepository.js';
import { comoLista, aGrupo } from '../dto/mappers.js';

export class GrupoRepositoryImpl extends GrupoRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listarPorColegio(colegioId) {
        return comoLista(await this.api.getGrupos(colegioId)).map(aGrupo);
    }

    async listarPorProfesional(profesionalId) {
        return comoLista(await this.api.getGruposPorProfesional(profesionalId)).map(aGrupo);
    }

    async crear({ colegioId, nombreGrupo, descripcion }) {
        await this.api.crearGrupo({
            colegio_id:   colegioId,
            nombre_grupo: nombreGrupo,
            descripcion,
        });
    }
}
