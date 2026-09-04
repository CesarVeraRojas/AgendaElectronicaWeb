import { ValidationError } from '../../core/errors.js';
import { calcularCambios, primerObligatorioVacio } from './_cambios.js';

/**
 * ActualizarPadre — Corrige los datos personales de un acudiente ya registrado.
 * Contra `actualizar_padre.php`, que acepta actualizaciones parciales.
 *
 * La contraseña NO se toca desde aquí por decisión de producto: restablecerla
 * es tarea de soporte, no del director.
 */
const CAMPOS = [
    'tipoDocumento', 'documento', 'nombres', 'apellidos',
    'parentesco', 'telefono', 'email', 'direccion',
];

const OBLIGATORIOS = {
    tipoDocumento: 'Tipo de documento',
    documento:     'Número de documento',
    nombres:       'Nombres',
    apellidos:     'Apellidos',
};

export class ActualizarPadre {
    constructor({ padreRepository }) {
        this.padreRepository = padreRepository;
    }

    async ejecutar({ original, editado }) {
        if (!original?.id) throw new ValidationError('No se ha seleccionado ningún acudiente.');

        const vacio = primerObligatorioVacio(editado, OBLIGATORIOS);
        if (vacio) throw new ValidationError(`${vacio} no puede quedar vacío.`);

        const cambios = calcularCambios(original, editado, CAMPOS);
        if (Object.keys(cambios).length === 0) {
            throw new ValidationError('No hay cambios que guardar.');
        }

        await this.padreRepository.actualizar(original.id, cambios);
        return 'Datos del acudiente actualizados.';
    }
}
