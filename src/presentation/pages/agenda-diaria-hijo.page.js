/**
 * agenda-diaria-hijo.page.js — Consulta de la agenda diaria (rol padre).
 * Espejo de: AgendaDiariaHijoScreen.kt + AgendaDiariaHijoViewModel.kt
 *
 * Sólo lectura. Al entrar selecciona el primer hijo y la fecha de hoy,
 * igual que hace el ViewModel de Android.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, filaInfo, spinner, estadoVacio, bloqueError, campoSelect, campoTexto } from '../components/ui.js';
import { hoyIso }           from '../components/formato.js';
import { avisoError }       from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Agenda Diaria de tu Hij@', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('', `
                    <div class="row-fields">
                        ${campoSelect({ id: 'hijo', etiqueta: 'Hij@', opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                        ${campoTexto({ id: 'fecha', etiqueta: 'Fecha', tipo: 'date', valor: hoyIso() })}
                    </div>`))}
                <div id="detalle-agenda"></div>
            </div>
        </div>`;
}

function pintarAgenda(agenda) {
    const cont = document.getElementById('detalle-agenda');

    if (!agenda || agenda.estaVacia()) {
        cont.innerHTML = estadoVacio('No hay datos de agenda para la fecha seleccionada.', 'event_busy');
        return;
    }

    cont.innerHTML = [
        seccion('ALIMENTACIÓN', [
            filaInfo('Snack AM:', agenda.alimentacionSnackAM),
            filaInfo('Almuerzo:', agenda.alimentacionAlmuerzo),
            filaInfo('Snack PM:', agenda.alimentacionSnackPM),
        ].join('')),
        seccion('CONTROL DE ESFÍNTERES', [
            filaInfo('Micción:',        agenda.controlEsfinteresMiccion),
            filaInfo('Deposición:',     agenda.controlEsfinteresDeposicion),
            filaInfo('Cambio de Pañal:', agenda.controlEsfinteresCambioPanal),
        ].join('')),
        seccion('ESTADO DE ÁNIMO',
            html`<p>${agenda.estadoAnimo.length ? agenda.estadoAnimo.join(', ') : 'No especificado'}</p>`),
        seccion('DESARROLLO DE COMPETENCIAS', html`<p>${agenda.desarrolloCompetencias ?? 'No especificado'}</p>`),
        seccion('EN LA CLASE',                html`<p>${agenda.enLaClase ?? 'No especificado'}</p>`),
        seccion('ROL SOCIAL',                 html`<p>${agenda.rolSocial ?? 'No especificado'}</p>`),
        seccion('COMENTARIOS DEL DÍA',        html`<p>${agenda.comentariosDelDia ?? 'No hay comentarios.'}</p>`),
    ].join('');
}

export async function init() {
    const sesion  = Casos.obtenerSesion.ejecutar();
    const selHijo = document.getElementById('hijo');
    const fecha   = document.getElementById('fecha');
    const cont    = document.getElementById('detalle-agenda');

    const cargarAgenda = async () => {
        if (!selHijo.value) return;
        cont.innerHTML = spinner('Cargando agenda…');
        try {
            pintarAgenda(await Casos.obtenerAgendaDeHijo.ejecutar(selHijo.value, fecha.value));
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
        await cargarAgenda();   // primer hijo + hoy, como en Android
    } catch (e) {
        avisoError(e.message);
        cont.innerHTML = bloqueError(e.message);
        return;
    }

    selHijo.addEventListener('change', cargarAgenda);
    fecha.addEventListener('change', cargarAgenda);
}
