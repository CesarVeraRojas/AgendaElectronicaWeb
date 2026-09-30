import { noImplementado } from './_contract.js';

/** El calendario de eventos del jardín (BL-76). */
export class EventoRepository {
    /** @returns {Promise<import('../entities/Evento.js').CalendarioDeEventos>} */
    listar({ desde = null, hasta = null } = {}) { noImplementado('EventoRepository', 'listar'); }
    /** @returns {Promise<import('../entities/Evento.js').Evento>} */
    guardar(nuevo)                              { noImplementado('EventoRepository', 'guardar'); }
    /** @returns {Promise<void>} */
    cancelar(eventoId)                          { noImplementado('EventoRepository', 'cancelar'); }
}
