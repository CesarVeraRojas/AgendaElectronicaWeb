import { JardinRepository } from '../../domain/repositories/JardinRepository.js';
import { aJardines, aAltaDeJardin } from '../dto/mappers.js';

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
}
