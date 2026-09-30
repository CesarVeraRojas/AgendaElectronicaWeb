import { ValidationError } from '../../core/errors.js';
import { validarCircular } from '../entities/Circular.js';

/**
 * PublicarCircular — El director publica una circular (BL-70).
 * Espejo de: CircularesViewModel.publicar()
 *
 * Se valida aquí con las mismas reglas del servidor para no subir un archivo de
 * 10 MB y enterarse después de que faltaba el título. El servidor vuelve a
 * comprobarlo todo, y es el único que decide que sólo el director publica.
 */
export class PublicarCircular {
    constructor({ circularRepository }) {
        this.circularRepository = circularRepository;
    }

    /** @param {import('../entities/Circular.js').NuevaCircular} nueva */
    async ejecutar(nueva) {
        const error = validarCircular({
            titulo:       nueva?.titulo,
            texto:        nueva?.texto,
            tieneAdjunto: Boolean(nueva?.adjunto),
        });
        if (error) throw new ValidationError(error);
        return this.circularRepository.publicar(nueva);
    }
}
