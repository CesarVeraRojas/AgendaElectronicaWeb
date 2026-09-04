import { ValidationError } from '../../core/errors.js';
import { calcularCambios, primerObligatorioVacio } from './_cambios.js';

/**
 * ActualizarGrupo — Cambia el nombre o la descripción de un grupo.
 *
 * A diferencia de los otros tres, `grupos.php` (PUT) NO acepta un diff: exige
 * `nombre_grupo` siempre. El diff sólo se usa aquí para no llamar a la red
 * cuando no se tocó nada; el repositorio envía la ficha completa.
 */
const CAMPOS = ['nombreGrupo', 'descripcion'];

const OBLIGATORIOS = { nombreGrupo: 'Nombre del grupo' };

export class ActualizarGrupo {
    constructor({ grupoRepository }) {
        this.grupoRepository = grupoRepository;
    }

    async ejecutar({ original, editado }) {
        if (!original?.id) throw new ValidationError('No se ha seleccionado ningún grupo.');

        const vacio = primerObligatorioVacio(editado, OBLIGATORIOS);
        if (vacio) throw new ValidationError(`${vacio} no puede quedar vacío.`);

        const cambios = calcularCambios(original, editado, CAMPOS);
        if (Object.keys(cambios).length === 0) {
            throw new ValidationError('No hay cambios que guardar.');
        }

        await this.grupoRepository.actualizar(original.id, {
            nombreGrupo: editado.nombreGrupo,
            descripcion: editado.descripcion,
        });
        return 'Datos del grupo actualizados.';
    }
}
