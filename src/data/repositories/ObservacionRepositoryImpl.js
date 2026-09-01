import { ObservacionRepository } from '../../domain/repositories/ObservacionRepository.js';
import { comoLista, aObservacion } from '../dto/mappers.js';

export class ObservacionRepositoryImpl extends ObservacionRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async crear(nueva) {
        await this.api.crearObservacion({
            estudiante_id:  nueva.estudianteId,
            profesional_id: nueva.profesionalId,
            observacion:    nueva.observacion,
            tipo:           nueva.tipo,
            visible_padre:  nueva.visiblePadre,
        });
    }

    async listarPorHijo(estudianteId) {
        return comoLista(await this.api.getObservacionesPorHijo(estudianteId)).map(aObservacion);
    }
}
