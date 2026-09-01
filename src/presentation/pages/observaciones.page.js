/**
 * observaciones.page.js — Registrar una observación pedagógica.
 * Espejo de: ObservacionesScreen.kt + ObservacionesViewModel.kt
 *
 * Flujo: grupo → estudiante → texto → guardar. Tras guardar, el formulario
 * se limpia igual que en Android.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, campoSelect, campoArea, botonPrimario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Registrar Observación', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Seleccionar Grupo y Estudiante', `
                    ${campoSelect({ id: 'grupo',      etiqueta: 'Grupo',      opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                    ${campoSelect({ id: 'estudiante', etiqueta: 'Estudiante', opciones: [], placeholder: 'Seleccione un grupo primero', deshabilitado: true })}`))}

                ${crudo(seccion('Detalle de la Observación',
                    campoArea({ id: 'texto', etiqueta: 'Observación', filas: 7, placeholder: 'Escribe la observación del día…', requerido: true })))}

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Observación', deshabilitado: true }))}
            </div>
        </div>`;
}

export async function init() {
    const sesion       = Casos.obtenerSesion.ejecutar();
    const selGrupo     = document.getElementById('grupo');
    const selEstudiante= document.getElementById('estudiante');
    const texto        = document.getElementById('texto');
    const btn          = document.getElementById('btn-guardar');

    const refrescarBoton = () => { btn.disabled = !selEstudiante.value; };

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
            const msg = await Casos.guardarObservacion.ejecutar({
                sesion,
                estudianteId: selEstudiante.value,
                texto: texto.value,
            });
            avisoExito(msg);
            texto.value = '';
            selEstudiante.value = '';
        } catch (e) {
            avisoError(e.message);
        } finally {
            refrescarBoton();
        }
    });
}
