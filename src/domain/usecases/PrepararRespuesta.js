import { NuevoMensaje, UsuarioMensaje } from '../entities/Mensaje.js';

/**
 * PrepararRespuesta — Espejo de ComposeMensajeViewModel.setupReply()
 *
 * Regla replicada: el destinatario es el remitente original y el asunto lleva
 * el prefijo "Re: ", salvo que ya lo tenga (comparación sin distinguir mayúsculas).
 */
export class PrepararRespuesta {
    ejecutar(mensajeOriginal) {
        const destinatario = new UsuarioMensaje({
            id:          mensajeOriginal.remitenteId,
            userType:    mensajeOriginal.remitenteType,
            displayName: mensajeOriginal.remitenteNombre ?? 'Remitente',
        });

        const yaEsRespuesta = mensajeOriginal.asunto.toLowerCase().startsWith('re: ');
        const asunto = yaEsRespuesta ? mensajeOriginal.asunto : `Re: ${mensajeOriginal.asunto}`;

        return new NuevoMensaje({ destinatarios: [destinatario], asunto, mensaje: '' });
    }
}
