import { CircularRepository } from '../../domain/repositories/CircularRepository.js';
import { aPaginaDeCirculares, aCircular, aLecturaDeCircular } from '../dto/mappers.js';

export class CircularRepositoryImpl extends CircularRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar({ antesDe = null } = {}) {
        return aPaginaDeCirculares(await this.api.getCirculares(antesDe));
    }

    async publicar(nueva) {
        const json = await this.api.publicarCircular({
            titulo:  nueva.titulo.trim(),
            texto:   nueva.texto.trim(),
            grupoId: nueva.grupoId,
            adjunto: nueva.adjunto,
        });
        return aCircular(json?.circular ?? {});
    }

    async eliminar(circularId) {
        await this.api.eliminarCircular(circularId);
    }

    async marcarLeida(circularId) {
        await this.api.marcarCircularLeida(circularId);
    }

    async lectura(circularId) {
        return aLecturaDeCircular(await this.api.getLecturaCircular(circularId));
    }
}
