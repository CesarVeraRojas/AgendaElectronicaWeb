/** ListarPadres — Acudientes del colegio, para el buscador de la pantalla de actualización. */
export class ListarPadres {
    constructor({ padreRepository }) {
        this.padreRepository = padreRepository;
    }

    ejecutar() {
        return this.padreRepository.listar();
    }
}
