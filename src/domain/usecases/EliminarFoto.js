import { ValidationError } from '../../core/errors.js';

/**
 * EliminarFoto — El director borra una foto (BL-61).
 * Espejo de: FotosColegioViewModel.eliminar()
 *
 * Sólo el director puede, y lo decide el servidor (eliminar_foto.php responde
 * 403 a cualquier otro rol): que la pantalla sólo exista en su menú es una
 * comodidad, no la defensa. El borrado es definitivo y las familias dejan de
 * ver la foto al momento.
 */
export class EliminarFoto {
    constructor({ fotoRepository }) {
        this.fotoRepository = fotoRepository;
    }

    async ejecutar(fotoId) {
        if (!fotoId) throw new ValidationError('No se indicó qué foto eliminar.');
        await this.fotoRepository.eliminar(fotoId);
        return 'Foto eliminada.';
    }
}
