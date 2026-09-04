import { ValidationError } from '../../core/errors.js';
import { calcularCambios, primerObligatorioVacio } from './_cambios.js';

/**
 * ActualizarEstudiante — Corrige los datos personales de un estudiante.
 * Contra `editar_estudiante.php`, que acepta actualizaciones parciales.
 *
 * El grupo NO se cambia aquí: no es un dato personal y vive en otra tabla
 * (`estudiante_grupo`, vía asignar_estudiante_grupo.php).
 */
const CAMPOS = [
    'tipoDocumento', 'documento', 'nombres', 'apellidos',
    'fechaNacimiento', 'genero', 'direccion', 'telefono', 'email',
];

const OBLIGATORIOS = {
    tipoDocumento:   'Tipo de documento',
    documento:       'Número de documento',
    nombres:         'Nombres',
    apellidos:       'Apellidos',
    fechaNacimiento: 'Fecha de nacimiento',
    genero:          'Género',
};

export class ActualizarEstudiante {
    constructor({ estudianteRepository }) {
        this.estudianteRepository = estudianteRepository;
    }

    async ejecutar({ original, editado }) {
        if (!original?.id) throw new ValidationError('No se ha seleccionado ningún estudiante.');

        const vacio = primerObligatorioVacio(editado, OBLIGATORIOS);
        if (vacio) throw new ValidationError(`${vacio} no puede quedar vacío.`);

        const cambios = calcularCambios(original, editado, CAMPOS);
        if (Object.keys(cambios).length === 0) {
            throw new ValidationError('No hay cambios que guardar.');
        }

        await this.estudianteRepository.actualizar(original.id, cambios);
        return 'Datos del estudiante actualizados.';
    }
}
