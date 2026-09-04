import { ValidationError } from '../../core/errors.js';
import { calcularCambios, primerObligatorioVacio } from './_cambios.js';

/**
 * ActualizarProfesional — Corrige los datos personales de un profesional.
 * Contra `actualizar_profesional.php`, que acepta actualizaciones parciales.
 *
 * Sin contraseña, igual que ActualizarPadre.
 */
const CAMPOS = ['tipoDocumento', 'documento', 'nombres', 'apellidos', 'telefono', 'email'];

const OBLIGATORIOS = {
    tipoDocumento: 'Tipo de documento',
    documento:     'Número de documento',
    nombres:       'Nombres',
    apellidos:     'Apellidos',
};

export class ActualizarProfesional {
    constructor({ profesionalRepository }) {
        this.profesionalRepository = profesionalRepository;
    }

    async ejecutar({ original, editado }) {
        if (!original?.id) throw new ValidationError('No se ha seleccionado ningún profesional.');

        const vacio = primerObligatorioVacio(editado, OBLIGATORIOS);
        if (vacio) throw new ValidationError(`${vacio} no puede quedar vacío.`);

        const cambios = calcularCambios(original, editado, CAMPOS);
        if (Object.keys(cambios).length === 0) {
            throw new ValidationError('No hay cambios que guardar.');
        }

        await this.profesionalRepository.actualizar(original.id, cambios);
        return 'Datos del profesional actualizados.';
    }
}
