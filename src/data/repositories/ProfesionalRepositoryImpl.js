import { ProfesionalRepository } from '../../domain/repositories/ProfesionalRepository.js';
import { comoLista, aProfesional, desdeProfesional, desdeCambiosProfesional } from '../dto/mappers.js';

export class ProfesionalRepositoryImpl extends ProfesionalRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar(colegioId) {
        return comoLista(await this.api.getProfesionales(colegioId)).map(aProfesional);
    }

    async obtener(id) {
        const json = await this.api.getProfesional(id);
        return aProfesional(json?.profesional ?? json?.data ?? json);
    }

    async actualizar(id, cambios) {
        await this.api.actualizarProfesional({
            id_profesional_a_actualizar: id,
            ...desdeCambiosProfesional(cambios),
        });
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
