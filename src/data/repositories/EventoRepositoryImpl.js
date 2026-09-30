import { EventoRepository } from '../../domain/repositories/EventoRepository.js';
import { aCalendarioDeEventos, aEvento } from '../dto/mappers.js';

export class EventoRepositoryImpl extends EventoRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar({ desde = null, hasta = null } = {}) {
        return aCalendarioDeEventos(await this.api.getEventos(desde, hasta));
    }

    async guardar(n) {
        const t = (x) => String(x ?? '').trim();
        const json = await this.api.guardarEvento({
            evento_id: n.eventoId ?? null, tipo: t(n.tipo), titulo: t(n.titulo), descripcion: t(n.descripcion),
            lugar: t(n.lugar), fecha_inicio: t(n.fechaInicio), fecha_fin: t(n.fechaFin) || t(n.fechaInicio),
            hora_inicio: t(n.horaInicio), hora_fin: t(n.horaFin), grupo_id: n.grupoId ?? null,
        });
        return aEvento(json?.evento ?? {});
    }

    async cancelar(eventoId) {
        await this.api.cancelarEvento(eventoId);
    }
}
