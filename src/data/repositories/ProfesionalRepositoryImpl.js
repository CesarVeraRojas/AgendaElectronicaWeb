import { ProfesionalRepository } from '../../domain/repositories/ProfesionalRepository.js';
import { comoLista, aProfesional, desdeProfesional } from '../dto/mappers.js';

export class ProfesionalRepositoryImpl extends ProfesionalRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar(colegioId) {
        return comoLista(await this.api.getProfesionales(colegioId)).map(aProfesional);
    }

    async crear(profesional) {
        await this.api.crearProfesional(desdeProfesional(profesional));
    }

    async asignarAGrupos(profesionalId, grupoIds) {
        await this.api.asignarGruposAProfesional({
            profesional_id: profesionalId,
            grupo_ids:      grupoIds,
        });
    }
}
