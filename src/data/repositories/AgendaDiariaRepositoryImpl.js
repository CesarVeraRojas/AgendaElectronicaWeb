import { AgendaDiariaRepository } from '../../domain/repositories/AgendaDiariaRepository.js';
import { aAgendaDiaria, desdeAgendaDiaria } from '../dto/mappers.js';

export class AgendaDiariaRepositoryImpl extends AgendaDiariaRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async guardar(agenda) {
        await this.api.guardarAgendaDiaria(desdeAgendaDiaria(agenda));
    }

    async obtener(estudianteId, fecha) {
        const json = await this.api.getAgendaDiaria(estudianteId, fecha);
        // Sin registro para ese día el backend devuelve vacío o un objeto sin fecha
        if (!json || Array.isArray(json) && json.length === 0) return null;
        const datos = Array.isArray(json) ? json[0] : (json.data ?? json);
        if (!datos || Object.keys(datos).length === 0) return null;
        return aAgendaDiaria(datos);
    }
}
