import { rangoDeLaSemana, semanaConHuecos } from '../entities/AgendaDiaria.js';

/** ObtenerAgendaDeHijo — Espejo de AgendaDiariaHijoViewModel.fetchAgenda() */
export class ObtenerAgendaDeHijo {
    constructor({ agendaDiariaRepository }) {
        this.agendaDiariaRepository = agendaDiariaRepository;
    }

    ejecutar(estudianteId, fecha) {
        return this.agendaDiariaRepository.obtener(estudianteId, fecha);
    }

    /**
     * La semana que contiene esa fecha, de lunes a domingo, en UN solo viaje al
     * servidor (BL-57). Antes esto eran siete peticiones, y por eso no existía.
     *
     * Devuelve los siete días, con su hueco donde no hay agenda: que falte es
     * información para la familia.
     */
    async semanaDe(estudianteId, fecha) {
        const { desde, hasta } = rangoDeLaSemana(fecha);
        const agendas = await this.agendaDiariaRepository.listarPorRango(estudianteId, desde, hasta);
        return { desde, hasta, dias: semanaConHuecos(fecha, agendas) };
    }
}
