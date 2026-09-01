/** Grupo — Espejo de data.Grupo */
export class Grupo {
    constructor({ id, nombreGrupo, descripcion = null }) {
        this.id          = id;
        this.nombreGrupo = nombreGrupo;
        this.descripcion = descripcion;
    }

    toString() { return this.nombreGrupo; }
}
