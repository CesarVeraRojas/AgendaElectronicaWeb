import { resumirLectura } from '../entities/Mensaje.js';

/**
 * ObtenerEstadoLectura — Quién ha leído un mensaje que yo envié.
 *
 * El backend agrupa por `envio_id`, así que devuelve a todos los destinatarios
 * del envío, no sólo al de la fila consultada. Sólo el remitente puede pedirlo:
 * a cualquier otro, get_estado_lectura.php responde 403.
 */
export class ObtenerEstadoLectura {
    constructor({ mensajeRepository }) {
        this.mensajeRepository = mensajeRepository;
    }

    /**
     * Si el usuario de la sesión es quien envió el mensaje.
     *
     * Se compara como cadena porque el id llega unas veces como número y otras
     * como texto, según el endpoint. No se mira de qué bandeja se venía: así la
     * sección aparece siempre que corresponde, se llegue por donde se llegue.
     */
    esRemitente(mensaje, sesion) {
        if (!mensaje || !sesion) return false;
        return String(mensaje.remitenteId) === String(sesion.userId) &&
               String(mensaje.remitenteType) === String(sesion.userType);
    }

    /** @returns {Promise<{destinatarios: DestinatarioLectura[], resumen: object}>} */
    async ejecutar(mensajeId) {
        const destinatarios = await this.mensajeRepository.estadoDeLectura(mensajeId);
        return { destinatarios, resumen: resumirLectura(destinatarios) };
    }
}
