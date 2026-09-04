/** Profesional — Espejo de data.Profesional */
export class Profesional {
    constructor({
        id, nombres, apellidos, email = null, documento = null,
        tipoDocumento = null, telefono = null,
    }) {
        this.id            = id;
        this.nombres       = nombres;
        this.apellidos     = apellidos;
        this.email         = email;
        this.documento     = documento;
        this.tipoDocumento = tipoDocumento;
        this.telefono      = telefono;
    }

    get nombreCompleto() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }
}
