/**
 * ObtenerPadre — Relee la ficha del acudiente justo antes de editarla, para no
 * trabajar sobre los datos que se cargaron con la lista.
 */
export class ObtenerPadre {
    constructor({ padreRepository }) {
        this.padreRepository = padreRepository;
    }

    ejecutar(id) {
        return this.padreRepository.obtener(id);
    }
}
