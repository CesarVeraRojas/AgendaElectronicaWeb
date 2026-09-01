import { EstudianteRepository } from '../../domain/repositories/EstudianteRepository.js';
import {
    comoLista, aEstudiante, desdeNuevoEstudiante, desdeAcudiente,
} from '../dto/mappers.js';

export class EstudianteRepositoryImpl extends EstudianteRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listarPorGrupo(grupoId) {
        // estudiantes_por_grupo.php devuelve {grupo:{...}, estudiantes:[...]}
        const json = await this.api.getEstudiantesPorGrupo(grupoId);
        return comoLista(json).map(aEstudiante);
    }

    async listarPorPadre(padreId) {
        return comoLista(await this.api.getEstudiantesPorPadre(padreId)).map(aEstudiante);
    }

    async crear(nuevoEstudiante) {
        const json = await this.api.crearEstudiante(desdeNuevoEstudiante(nuevoEstudiante));
        return json?.id ?? json?.estudiante_id ?? null;
    }

    async crearAcudiente(acudiente) {
        const json = await this.api.crearPadre(desdeAcudiente(acudiente));
        return json?.id ?? json?.padre_id ?? null;
    }

    async asignarAcudientes(estudianteId, acudienteIds) {
        await this.api.asignarPadres({
            estudiante_id: estudianteId,
            padre_id:      acudienteIds,
        });
    }

    async asignarAGrupo(estudianteId, grupoId) {
        await this.api.asignarGrupo({
            estudiante_id: estudianteId,
            grupo_id:      grupoId,
        });
    }
}
