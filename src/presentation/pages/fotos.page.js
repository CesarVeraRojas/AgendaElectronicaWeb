/**
 * fotos.page.js — Subir foto de un estudiante.
 * Espejo de: FotosScreen.kt + FotosViewModel.kt
 *
 * En Android hubo que detectar el MIME para no guardar archivos .tmp; en web
 * el objeto File ya trae nombre y tipo reales. La validación de tipo vive en
 * el caso de uso SubirFoto, no aquí.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, campoSelect, botonPrimario, botonSecundario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let archivo = null;

export function render() {
    archivo = null;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Subir Foto', volverA: 'menu' }))}
            <div class="page-content">
                <div class="photo-preview" id="preview">
                    <span class="material-icons photo-preview__icon">add_a_photo</span>
                    <p>Ninguna foto seleccionada</p>
                </div>

                <input type="file" id="input-foto" accept="image/jpeg,image/png,image/gif" hidden />
                ${crudo(botonSecundario({ id: 'btn-elegir', texto: 'Seleccionar Foto', icono: 'photo_library', ancho: true }))}

                ${crudo(seccion('Destino de la Foto', `
                    ${campoSelect({ id: 'grupo',      etiqueta: 'Grupo',      opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                    ${campoSelect({ id: 'estudiante', etiqueta: 'Estudiante', opciones: [], placeholder: 'Seleccione un grupo primero', deshabilitado: true })}`))}

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Foto', deshabilitado: true }))}
            </div>
        </div>`;
}

export async function init() {
    const sesion        = Casos.obtenerSesion.ejecutar();
    const selGrupo      = document.getElementById('grupo');
    const selEstudiante = document.getElementById('estudiante');
    const inputFoto     = document.getElementById('input-foto');
    const preview       = document.getElementById('preview');
    const btn           = document.getElementById('btn-guardar');

    const refrescarBoton = () => { btn.disabled = !(selEstudiante.value && archivo); };

    document.getElementById('btn-elegir').addEventListener('click', () => inputFoto.click());

    inputFoto.addEventListener('change', () => {
        archivo = inputFoto.files?.[0] ?? null;
        if (archivo) {
            const url = URL.createObjectURL(archivo);
            preview.innerHTML = `<img class="photo-preview__img" src="${url}" alt="Vista previa" />`;
        }
        refrescarBoton();
    });

    try {
        const grupos = await Casos.obtenerGruposDelUsuario.ejecutar(sesion);
        selGrupo.innerHTML = `<option value="">Seleccione un grupo…</option>` +
            grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        avisoError(e.message);
    }

    selGrupo.addEventListener('change', async () => {
        selEstudiante.innerHTML = `<option value="">Cargando…</option>`;
        selEstudiante.disabled = true;
        refrescarBoton();

        if (!selGrupo.value) {
            selEstudiante.innerHTML = `<option value="">Seleccione un grupo primero</option>`;
            return;
        }

        try {
            const estudiantes = await Casos.obtenerEstudiantesPorGrupo.ejecutar(selGrupo.value);
            selEstudiante.innerHTML = estudiantes.length
                ? `<option value="">Seleccione un estudiante…</option>` +
                  estudiantes.map(e => `<option value="${esc(e.id)}">${esc(e.nombreCompleto)}</option>`).join('')
                : `<option value="">No hay estudiantes en este grupo</option>`;
            selEstudiante.disabled = !estudiantes.length;
        } catch (e) {
            selEstudiante.innerHTML = `<option value="">Error al cargar</option>`;
            avisoError(e.message);
        }
    });

    selEstudiante.addEventListener('change', refrescarBoton);

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.subirFoto.ejecutar({ estudianteId: selEstudiante.value, archivo });
            avisoExito(msg);
            archivo = null;
            inputFoto.value = '';
            preview.innerHTML = `<span class="material-icons photo-preview__icon">add_a_photo</span><p>Ninguna foto seleccionada</p>`;
        } catch (e) {
            avisoError(e.message);
        } finally {
            refrescarBoton();
        }
    });
}
