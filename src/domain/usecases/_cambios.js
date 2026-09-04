/**
 * _cambios.js — Cálculo del diff entre el registro original y el editado.
 *
 * Los endpoints de actualización del backend recorren su lista de campos con
 * `isset($data[$campo])`: sólo tocan lo que se les manda. Aprovecharlo evita
 * reescribir columnas que nadie cambió y hace que un choque de unicidad
 * (documento o email repetido) sólo pueda venir de un campo que el usuario
 * acaba de tocar.
 *
 * Es regla de negocio, no de pantalla: vive en el dominio y se prueba sin DOM.
 */

/** Todo se compara como texto recortado: los `<input>` siempre devuelven cadenas. */
function normalizar(valor) {
    return String(valor ?? '').trim();
}

/**
 * @param {object} original  registro tal como vino del backend
 * @param {object} editado   valores actuales del formulario
 * @param {string[]} campos  nombres de dominio que el endpoint permite actualizar
 * @returns {object} sólo los campos cuyo valor cambió
 */
export function calcularCambios(original, editado, campos) {
    const cambios = {};
    for (const campo of campos) {
        const antes = normalizar(original?.[campo]);
        const ahora = normalizar(editado?.[campo]);
        if (antes !== ahora) cambios[campo] = ahora;
    }
    return cambios;
}

/**
 * Comprueba que ningún campo obligatorio se haya dejado en blanco.
 * @returns {string|null} el nombre legible del primer campo vacío, o null
 */
export function primerObligatorioVacio(editado, obligatorios) {
    for (const [campo, etiqueta] of Object.entries(obligatorios)) {
        if (normalizar(editado?.[campo]) === '') return etiqueta;
    }
    return null;
}
