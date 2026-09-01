/** ObtenerColegio — Espejo de MenuViewModel.fetchColegioDetails() */
export class ObtenerColegio {
    constructor({ colegioRepository }) {
        this.colegioRepository = colegioRepository;
    }

    ejecutar(colegioId) {
        return this.colegioRepository.obtenerDetalles(colegioId);
    }
}
