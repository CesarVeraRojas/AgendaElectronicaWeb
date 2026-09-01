import { noImplementado } from './_contract.js';

export class MensajeRepository {
    /** @returns {Promise<Mensaje[]>} */
    listar(userId, userType, bandeja) { noImplementado('MensajeRepository', 'listar'); }
    /** @returns {Promise<UsuarioMensaje[]>} */
    listarDestinatarios(userId, userType) { noImplementado('MensajeRepository', 'listarDestinatarios'); }
    /** @returns {Promise<void>} */
    enviar(nuevoMensaje, remitente)   { noImplementado('MensajeRepository', 'enviar'); }
    /** @returns {Promise<void>} */
    marcarLeido(mensajeId)            { noImplementado('MensajeRepository', 'marcarLeido'); }
}
