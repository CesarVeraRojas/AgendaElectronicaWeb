/** ObtenerEstudiantesPorGrupo — Espejo de fetchEstudiantesPorGrupo() */
export class ObtenerEstudiantesPorGrupo {
    constructor({ estudianteRepository }) {
        this.estudianteRepository = estudianteRepository;
    }

    ejecutar(grupoId) {
        return this.estudianteRepository.listarPorGrupo(grupoId);
    }
}
