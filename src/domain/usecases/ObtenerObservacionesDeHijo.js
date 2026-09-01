/** ObtenerObservacionesDeHijo — Espejo de ObservacionesHijoViewModel.fetchObservaciones() */
export class ObtenerObservacionesDeHijo {
    constructor({ observacionRepository }) {
        this.observacionRepository = observacionRepository;
    }

    ejecutar(estudianteId) {
        return this.observacionRepository.listarPorHijo(estudianteId);
    }
}
