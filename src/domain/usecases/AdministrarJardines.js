import { ValidationError } from '../../core/errors.js';
import { validarNuevoJardin, validarJardinEditado } from '../entities/Jardin.js';

/**
 * AdministrarJardines — Lo que hace soporte (BL-74): ver los jardines y dar de
 * alta uno nuevo con su primer director. Sólo en la web.
 *
 * El servidor sólo lo permite al rol soporte; aquí se valida antes de enviar
 * con las mismas reglas, para decirlo sin esperar la respuesta.
 */
export class AdministrarJardines {
    constructor({ jardinRepository }) {
        this.jardinRepository = jardinRepository;
    }

    listar() {
        return this.jardinRepository.listar();
    }

    async darDeAlta(nuevo) {
        const error = validarNuevoJardin(nuevo);
        if (error) throw new ValidationError(error);
        return this.jardinRepository.darDeAlta(nuevo);
    }

    /** Corregir los datos del jardín y de sus directores (2026-11-20). */
    async editar(editado) {
        const error = validarJardinEditado(editado);
        if (error) throw new ValidationError(error);
        return this.jardinRepository.editar(editado);
    }
}
