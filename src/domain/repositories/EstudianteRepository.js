import { noImplementado } from './_contract.js';

export class EstudianteRepository {
    /** @returns {Promise<Estudiante[]>} */
    listarPorGrupo(grupoId)  { noImplementado('EstudianteRepository', 'listarPorGrupo'); }
    /** @returns {Promise<Estudiante[]>} */
    listarPorPadre(padreId)  { noImplementado('EstudianteRepository', 'listarPorPadre'); }
    /** @returns {Promise<Estudiante[]>} todos los del colegio, con la ficha completa */
    listar()                 { noImplementado('EstudianteRepository', 'listar'); }
    /** @param {object} cambios sólo los campos modificados @returns {Promise<void>} */
    actualizar(id, cambios)  { noImplementado('EstudianteRepository', 'actualizar'); }
    /** @returns {Promise<number>} id del estudiante creado */
    crear(nuevoEstudiante)   { noImplementado('EstudianteRepository', 'crear'); }
    /** @returns {Promise<number>} id del acudiente creado */
    crearAcudiente(acudiente){ noImplementado('EstudianteRepository', 'crearAcudiente'); }
    /** @returns {Promise<void>} */
    asignarAcudientes(estudianteId, acudienteIds) { noImplementado('EstudianteRepository', 'asignarAcudientes'); }
    /** @returns {Promise<void>} */
    asignarAGrupo(estudianteId, grupoId)          { noImplementado('EstudianteRepository', 'asignarAGrupo'); }
}
