/** ObtenerAgendaDeHijo — Espejo de AgendaDiariaHijoViewModel.fetchAgenda() */
export class ObtenerAgendaDeHijo {
    constructor({ agendaDiariaRepository }) {
        this.agendaDiariaRepository = agendaDiariaRepository;
    }

    ejecutar(estudianteId, fecha) {
        return this.agendaDiariaRepository.obtener(estudianteId, fecha);
    }
}
