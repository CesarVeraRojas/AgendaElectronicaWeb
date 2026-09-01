import { noImplementado } from './_contract.js';

export class ProfesionalRepository {
    /** @returns {Promise<Profesional[]>} */
    listar(colegioId)                        { noImplementado('ProfesionalRepository', 'listar'); }
    /** @returns {Promise<void>} */
    crear(profesional)                       { noImplementado('ProfesionalRepository', 'crear'); }
    /** @returns {Promise<void>} */
    asignarAGrupos(profesionalId, grupoIds)  { noImplementado('ProfesionalRepository', 'asignarAGrupos'); }
}
