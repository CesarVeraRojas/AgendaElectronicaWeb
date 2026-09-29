/**
 * ObtenerFotosDelColegio — La galería del director (BL-61).
 * Espejo de: viewmodels/FotosColegioViewModel.kt
 *
 * Sólo el director: fotos_colegio.php responde 403 a cualquier otro rol. El
 * servidor ya las devuelve en orden, filtradas y por páginas; aquí no se ordena
 * ni se filtra nada.
 *
 * Además da las listas de los dos filtros: los grupos del colegio y los
 * estudiantes, que son los del grupo elegido o, sin grupo, los de todo el
 * colegio.
 */
export class ObtenerFotosDelColegio {
    constructor({ fotoRepository, grupoRepository, estudianteRepository }) {
        this.fotoRepository       = fotoRepository;
        this.grupoRepository      = grupoRepository;
        this.estudianteRepository = estudianteRepository;
    }

    /** @param {{grupoId:?number, estudianteId:?number, antesDe:?number}} filtro */
    ejecutar({ grupoId = null, estudianteId = null, antesDe = null } = {}) {
        return this.fotoRepository.listarDelColegio({ grupoId, estudianteId, antesDe });
    }

    gruposDelColegio(colegioId) {
        return this.grupoRepository.listarPorColegio(colegioId);
    }

    /** Sin grupo, todos los del colegio, ordenados por nombre para el desplegable. */
    async estudiantes(grupoId = null) {
        const lista = grupoId
            ? await this.estudianteRepository.listarPorGrupo(grupoId)
            : await this.estudianteRepository.listar();
        return [...lista].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
    }
}
