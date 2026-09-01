import { AsistenciaRepository } from '../../domain/repositories/AsistenciaRepository.js';

export class AsistenciaRepositoryImpl extends AsistenciaRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async registrar(registro) {
        await this.api.crearAsistencia({
            estudiante_id:  registro.estudianteId,
            fecha:          registro.fecha,
            estado:         registro.estado,
            registrado_por: registro.registradoPor,
        });
    }
}
