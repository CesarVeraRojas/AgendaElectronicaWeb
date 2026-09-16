import { InformeRepository } from '../../domain/repositories/InformeRepository.js';
import { aInformeAsistencia, aResumenColegio } from '../dto/mappers.js';

export class InformeRepositoryImpl extends InformeRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async asistenciaPorGrupoYMes({ anio, mes, grupoId = null }) {
        return aInformeAsistencia(await this.api.getInformeAsistencia(anio, mes, grupoId));
    }

    async resumenDelColegio() {
        return aResumenColegio(await this.api.getResumenDelColegio());
    }
}
