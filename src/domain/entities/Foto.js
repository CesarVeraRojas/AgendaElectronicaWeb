/** Foto — Espejo de data.Foto y data.FotosHijoResponse */
export class Foto {
    constructor({ id, fotoUrl, fechaSubida }) {
        this.id          = id;
        this.fotoUrl     = fotoUrl;
        this.fechaSubida = fechaSubida;
    }
}

export class FotosDeHijo {
    constructor({ hijoId, nombreHijo, fotos = [] }) {
        this.hijoId     = hijoId;
        this.nombreHijo = nombreHijo;
        this.fotos      = fotos;
    }
}
