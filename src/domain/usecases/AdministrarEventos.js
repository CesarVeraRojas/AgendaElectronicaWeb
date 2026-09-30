import { ValidationError } from '../../core/errors.js';
import { validarEvento } from '../entities/Evento.js';

/**
 * AdministrarEventos — El calendario de eventos (BL-76).
 * Espejo de: viewmodels/EventosViewModel.kt
 *
 * Quién ve, crea, edita y cancela lo decide el servidor (el director, todo su
 * jardín; un profesional, sólo sus grupos y sus eventos). Aquí se valida antes
 * de enviar con las mismas palabras.
 */
export class AdministrarEventos {
    constructor({ eventoRepository }) {
        this.eventoRepository = eventoRepository;
    }

    listar(rango = {}) {
        return this.eventoRepository.listar(rango);
    }

    async guardar(nuevo, { hoy = null, esProfesional = false } = {}) {
        const error = validarEvento(nuevo, hoy, esProfesional);
        if (error) throw new ValidationError(error);
        return this.eventoRepository.guardar(nuevo);
    }

    async cancelar(eventoId) {
        if (!eventoId) throw new ValidationError('No se indicó qué evento cancelar.');
        await this.eventoRepository.cancelar(eventoId);
        return 'Evento cancelado.';
    }
}
