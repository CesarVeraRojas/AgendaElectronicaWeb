/**
 * observaciones-hijo.page.js — Observaciones del hijo (rol padre).
 * Espejo de: ObservacionesHijoScreen.kt + ObservacionesHijoViewModel.kt
 *
 * El backend ya filtra por visible_padre = 1 y valida que el estudiante sea
 * hijo del padre autenticado (get_observaciones_por_hijo.php).
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, spinner, estadoVacio, bloqueError, campoSelect } from '../components/ui.js';
import { fechaLarga }       from '../components/formato.js';
import { avisoError }       from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Observaciones de tu Hij@', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('', campoSelect({ id: 'hijo', etiqueta: 'Hij@', opciones: [], placeholder: 'Cargando…', deshabilitado: true })))}
                <div id="lista-observaciones"></div>
            </div>
        </div>`;
}

export async function init() {
    const sesion  = Casos.obtenerSesion.ejecutar();
    const selHijo = document.getElementById('hijo');
    const cont    = document.getElementById('lista-observaciones');

    const cargar = async () => {
        if (!selHijo.value) return;
        cont.innerHTML = spinner('Cargando observaciones…');
        try {
            const observaciones = await Casos.obtenerObservacionesDeHijo.ejecutar(selHijo.value);
            if (!observaciones.length) {
                cont.innerHTML = estadoVacio('No hay observaciones para este hij@.', 'note_alt');
                return;
            }
            cont.innerHTML = observaciones.map(o => html`
                <article class="card obs-card">
                    <div class="obs-card__head">
                        <span class="obs-card__date">${fechaLarga(o.fecha)}</span>
                        ${crudo(o.tipo ? `<span class="badge">${esc(o.tipo)}</span>` : '')}
                    </div>
                    <p class="obs-card__text">${o.observacion}</p>
                    ${crudo(o.profesionalNombre ? `<p class="obs-card__author">— ${esc(o.profesionalNombre)}</p>` : '')}
                </article>`).join('');
        } catch (e) {
            cont.innerHTML = bloqueError(e.message);
        }
    };

    try {
        const hijos = await Casos.obtenerHijos.ejecutar(sesion);
        if (!hijos.length) {
            selHijo.innerHTML = `<option value="">Sin hijos asociados</option>`;
            cont.innerHTML = estadoVacio('No se encontraron hijos asociados a este padre.', 'child_care');
            return;
        }
        selHijo.innerHTML = hijos.map(h => `<option value="${esc(h.id)}">${esc(h.nombreCompleto)}</option>`).join('');
        selHijo.disabled = false;
        await cargar();
    } catch (e) {
        avisoError(e.message);
        cont.innerHTML = bloqueError(e.message);
        return;
    }

    selHijo.addEventListener('change', cargar);
}
