import { noImplementado } from './_contract.js';

export class EstudianteRepository {
    /** @returns {Promise<Estudiante[]>} */
    listarPorGrupo(grupoId)  { noImplementado('EstudianteRepository', 'listarPorGrupo'); }
    /** @returns {Promise<Estudiante[]>} */
    listarPorPadre(padreId)  { noImplementado('EstudianteRepository', 'listarPorPadre'); }
    /** @returns {Promise<number>} id del estudiante creado */
    crear(nuevoEstudiante)   { noImplementado('EstudianteRepository', 'crear'); }
    /** @returns {Promise<number>} id del acudiente creado */
    crearAcudiente(acudiente){ noImplementado('EstudianteRepository', 'crearAcudiente'); }
    /** @returns {Promise<void>} */
    asignarAcudientes(estudianteId, acudienteIds) { noImplementado('EstudianteRepository', 'asignarAcudientes'); }
    /** @returns {Promise<void>} */
    asignarAGrupo(estudianteId, grupoId)          { noImplementado('EstudianteRepository', 'asignarAGrupo'); }
}
