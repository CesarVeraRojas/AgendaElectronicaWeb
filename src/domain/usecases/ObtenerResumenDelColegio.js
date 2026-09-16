/**
 * ObtenerResumenDelColegio — La portada del director (BL-58).
 * Espejo de: MenuViewModel.cargarResumen()
 *
 * Sólo el director: `resumen_colegio.php` responde 403 a cualquier otro rol.
 * Las cuentas las hace el servidor; aquí no se suma nada.
 */
export class ObtenerResumenDelColegio {
    constructor({ informeRepository }) {
        this.informeRepository = informeRepository;
    }

    ejecutar() {
        return this.informeRepository.resumenDelColegio();
    }
}
