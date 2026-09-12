import { MensajeRepository } from '../../domain/repositories/MensajeRepository.js';
import { comoLista, aMensaje, aUsuarioMensaje, aDestinatarioLectura } from '../dto/mappers.js';

export class MensajeRepositoryImpl extends MensajeRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar(userId, userType, bandeja) {
        return comoLista(await this.api.getMensajes(userId, userType, bandeja)).map(aMensaje);
    }

    async listarDestinatarios(userId, userType) {
        return comoLista(await this.api.getUsuariosParaMensajes(userId, userType)).map(aUsuarioMensaje);
    }

    async listarAcudientesDeGrupo(grupoId) {
        return comoLista(await this.api.getAcudientesDeGrupo(grupoId)).map(aUsuarioMensaje);
    }

    /**
     * Con adjunto va por multipart; sin adjunto, por JSON.
     * Es la misma bifurcación que hace ComposeMensajeViewModel.onSendMensaje().
     */
    async enviar(nuevoMensaje, remitente) {
        const destinatarios = nuevoMensaje.destinatarios.map(d => ({
            destinatario_id:   d.id,
            destinatario_type: d.userType,
        }));

        if (nuevoMensaje.tieneAdjunto()) {
            await this.api.enviarMensajeMultipart({
                destinatariosJson: JSON.stringify(destinatarios),
                asunto:            nuevoMensaje.asunto,
                mensaje:           nuevoMensaje.mensaje,
                adjunto:           nuevoMensaje.adjunto,
            });
            return;
        }

        await this.api.enviarMensaje({
            remitente_id:   remitente.userId,
            remitente_type: remitente.userType,
            destinatarios,
            asunto:         nuevoMensaje.asunto,
            mensaje:        nuevoMensaje.mensaje,
        });
    }

    async marcarLeido(mensajeId) {
        await this.api.marcarMensajeLeido(mensajeId);
    }

    async estadoDeLectura(mensajeId) {
        return comoLista(await this.api.getEstadoLectura(mensajeId)).map(aDestinatarioLectura);
    }
}
