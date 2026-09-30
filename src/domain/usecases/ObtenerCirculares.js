/**
 * ObtenerCirculares — Las circulares que puede ver quien tiene la sesión (BL-70).
 * Espejo de: viewmodels/CircularesViewModel.kt
 *
 * Quién ve cuáles lo decide el servidor (circulares.php): el director todas las
 * de su colegio, el profesional las del colegio y las de sus grupos, la familia
 * las del colegio y las de los grupos de sus hijos. Aquí no se filtra nada.
 *
 * Da además los grupos del colegio, para que el director elija a quién va una
 * circular nueva.
 */
export class ObtenerCirculares {
    constructor({ circularRepository, grupoRepository }) {
        this.circularRepository = circularRepository;
        this.grupoRepository    = grupoRepository;
    }

    ejecutar({ antesDe = null } = {}) {
        return this.circularRepository.listar({ antesDe });
    }

    gruposDelColegio(colegioId) {
        return this.grupoRepository.listarPorColegio(colegioId);
    }

    /** El acuse de una circular, familia por familia. Sólo el director. */
    lectura(circularId) {
        return this.circularRepository.lectura(circularId);
    }
}
