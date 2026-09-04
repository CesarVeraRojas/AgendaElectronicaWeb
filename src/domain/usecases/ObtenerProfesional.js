/** ObtenerProfesional — Relee la ficha del profesional antes de editarla. */
export class ObtenerProfesional {
    constructor({ profesionalRepository }) {
        this.profesionalRepository = profesionalRepository;
    }

    ejecutar(id) {
        return this.profesionalRepository.obtener(id);
    }
}
