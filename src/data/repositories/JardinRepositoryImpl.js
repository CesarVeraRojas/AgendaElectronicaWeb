import { JardinRepository } from '../../domain/repositories/JardinRepository.js';
import { aJardines, aAltaDeJardin, aJardinEditado } from '../dto/mappers.js';

export class JardinRepositoryImpl extends JardinRepository {
    constructor({ apiDataSource }) {
        super();
        this.api = apiDataSource;
    }

    async listar() {
        return aJardines(await this.api.getJardines());
    }

    async darDeAlta(n) {
        const d = n.director;
        return aAltaDeJardin(await this.api.altaJardin({
            jardin:   { nombre: n.nombre.trim(), direccion: n.direccion.trim(), correo: n.correo.trim() },
            director: { nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), tipo_documento: d.tipoDocumento,
                        documento: d.documento.trim(), email: d.email.trim(), telefono: d.telefono.trim(), password: d.password },
        }));
    }

    async editar(e) {
        const t = (x) => String(x ?? '').trim();
        return aJardinEditado(await this.api.editarJardin({
            id: e.id, nombre: t(e.nombre), direccion: t(e.direccion), correo: t(e.correo),
            directores: e.directores.map(d => ({ id: d.id, nombres: t(d.nombres), apellidos: t(d.apellidos),
                                                 email: t(d.email), telefono: t(d.telefono) })),
        }));
    }
}
