/** ObtenerSesion — Acceso de sólo lectura a la sesión actual. */
export class ObtenerSesion {
    constructor({ sesionRepository }) {
        this.sesionRepository = sesionRepository;
    }

    ejecutar() {
        return this.sesionRepository.obtener();
    }
}
