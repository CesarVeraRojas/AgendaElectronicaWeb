import { noImplementado } from './_contract.js';

export class AsistenciaRepository {
    /** @returns {Promise<void>} */
    registrar(registroAsistencia) { noImplementado('AsistenciaRepository', 'registrar'); }

    /** @returns {Promise<AsistenciaRegistrada[]>} Sólo lectura, para el rol padre. */
    listarPorHijo(estudianteId, desde, hasta) { noImplementado('AsistenciaRepository', 'listarPorHijo'); }
}
