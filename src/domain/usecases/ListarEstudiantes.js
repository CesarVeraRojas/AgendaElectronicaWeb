/** ListarEstudiantes — Todos los del colegio con la ficha completa (estudiantes.php). */
export class ListarEstudiantes {
    constructor({ estudianteRepository }) {
        this.estudianteRepository = estudianteRepository;
    }

    ejecutar() {
        return this.estudianteRepository.listar();
    }
}
