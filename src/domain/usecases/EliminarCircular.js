import { ValidationError } from '../../core/errors.js';

/**
 * EliminarCircular — El director retira una circular (BL-70).
 * Espejo de: CircularesViewModel.eliminar()
 *
 * Sólo el director, y lo decide el servidor (eliminar_circular.php responde 403
 * a cualquier otro). Es definitivo: se van la circular, su archivo y el
 * registro de quién la leyó.
 */
export class EliminarCircular {
    constructor({ circularRepository }) {
        this.circularRepository = circularRepository;
    }

    async ejecutar(circularId) {
        if (!circularId) throw new ValidationError('No se indicó qué circular retirar.');
        await this.circularRepository.eliminar(circularId);
        return 'Circular retirada.';
    }
}
