/**
 * Padre — El acudiente ya registrado, tal como lo devuelven
 * `listar_padres.php` y `obtener_padre.php`.
 *
 * `Acudiente` (en Estudiante.js) es distinto: representa el alta que se hace
 * junto al estudiante y exige contraseña. Éste es el registro existente.
 */
export class Padre {
    constructor({
        id, tipoDocumento = null, documento = null, nombres = '', apellidos = '',
        parentesco = null, telefono = null, email = null, direccion = null,
    }) {
        this.id            = id;
        this.tipoDocumento = tipoDocumento;
        this.documento     = documento;
        this.nombres       = nombres;
        this.apellidos     = apellidos;
        this.parentesco    = parentesco;
        this.telefono      = telefono;
        this.email         = email;
        this.direccion     = direccion;
    }

    get nombreCompleto() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }
}
