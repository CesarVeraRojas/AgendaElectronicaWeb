import { AgendaDiariaRepository } from '../../domain/repositories/AgendaDiariaRepository.js';
import { aAgendaDiaria, desdeAgendaDiaria } from '../dto/mappers.js';
import { ServerError } from '../../core/errors.js';

export class AgendaDiariaRepositoryImpl extends AgendaDiariaRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async guardar(agenda) {
        await this.api.guardarAgendaDiaria(desdeAgendaDiaria(agenda));
    }

    async obtener(estudianteId, fecha) {
        let json;
        try {
            json = await this.api.getAgendaDiaria(estudianteId, fecha);
        } catch (e) {
            // Cuando no hay agenda para ese día, agenda_diaria.php responde 404.
            // Es el caso normal (aún no se ha rellenado), no un fallo: se traduce
            // a "sin datos" para que la pantalla muestre su estado vacío.
            if (e instanceof ServerError && e.status === 404) return null;
            throw e;
        }
        // Sin registro para ese día el backend devuelve vacío o un objeto sin fecha
        if (!json || Array.isArray(json) && json.length === 0) return null;
        const datos = Array.isArray(json) ? json[0] : (json.data ?? json);
        if (!datos || Object.keys(datos).length === 0) return null;
        return aAgendaDiaria(datos);
    }
}
