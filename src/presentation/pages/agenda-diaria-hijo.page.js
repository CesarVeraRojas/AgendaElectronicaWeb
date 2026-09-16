/**
 * agenda-diaria-hijo.page.js — Consulta de la agenda diaria (rol padre).
 * Espejo de: AgendaDiariaHijoScreen.kt + AgendaDiariaHijoViewModel.kt
 *
 * Sólo lectura. Al entrar selecciona el primer hijo y la fecha de hoy,
 * igual que hace el ViewModel de Android.
 *
 * **Desde BL-57 tiene dos vistas: Día y Semana.** La semana llega en un solo
 * viaje al servidor gracias al rango que se añadió a `agenda_diaria.php`; antes
 * habrían sido siete peticiones por niño, y por eso no existía el histórico.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, filaInfo, spinner, estadoVacio, bloqueError, campoSelect, campoTexto } from '../components/ui.js';
import { hoyIso, fechaLarga } from '../components/formato.js';
import { resumenDelDia }   from '../../domain/entities/AgendaDiaria.js';
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

                <div class="vista-tabs" role="tablist">
                    <button class="vista-tab vista-tab--activa" id="tab-dia" role="tab" aria-selected="true">Día</button>
                    <button class="vista-tab" id="tab-semana" role="tab" aria-selected="false">Semana</button>
                </div>

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

/** Una tarjeta por día de la semana, con hueco donde no hay agenda. */
function pintarSemana({ dias }) {
    const cont = document.getElementById('detalle-agenda');

    cont.innerHTML = dias.map(({ fecha, nombre, agenda }) => html`
        <article class="card week-day ${crudo(agenda ? '' : 'week-day--vacio')}"
                 data-fecha="${fecha}" ${crudo(agenda ? 'role="button" tabindex="0"' : '')}>
            <div class="week-day__head">
                <span class="week-day__name">${nombre}</span>
                <span class="week-day__date">${fechaLarga(fecha)}</span>
            </div>
            <p class="week-day__summary">${resumenDelDia(agenda)}</p>
            ${crudo(agenda && agenda.comentariosDelDia
                ? html`<p class="week-day__comment">${agenda.comentariosDelDia}</p>`
                : '')}
        </article>`).join('');
}

export async function init() {
    const sesion  = Casos.obtenerSesion.ejecutar();
    const selHijo = document.getElementById('hijo');
    const fecha   = document.getElementById('fecha');
    const cont    = document.getElementById('detalle-agenda');

    const tabDia    = document.getElementById('tab-dia');
    const tabSemana = document.getElementById('tab-semana');

    // La vista elegida es de la pantalla, no del dominio: no se guarda en
    // ningún sitio y cada visita empieza en Día, como siempre.
    let vista = 'dia';

    const cargarAgenda = async () => {
        if (!selHijo.value) return;
        cont.innerHTML = spinner(vista === 'dia' ? 'Cargando agenda…' : 'Cargando la semana…');
        try {
            if (vista === 'dia') {
                pintarAgenda(await Casos.obtenerAgendaDeHijo.ejecutar(selHijo.value, fecha.value));
            } else {
                pintarSemana(await Casos.obtenerAgendaDeHijo.semanaDe(selHijo.value, fecha.value));
            }
        } catch (e) {
            cont.innerHTML = bloqueError(e.message);
        }
    };

    const cambiarVista = (nueva) => {
        if (vista === nueva) return;
        vista = nueva;
        tabDia.classList.toggle('vista-tab--activa', nueva === 'dia');
        tabSemana.classList.toggle('vista-tab--activa', nueva === 'semana');
        tabDia.setAttribute('aria-selected', String(nueva === 'dia'));
        tabSemana.setAttribute('aria-selected', String(nueva === 'semana'));
        cargarAgenda();
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

    tabDia.addEventListener('click', () => cambiarVista('dia'));
    tabSemana.addEventListener('click', () => cambiarVista('semana'));

    // Tocar un día de la semana lleva a ese día completo: la semana es el
    // índice y el día es el detalle.
    cont.addEventListener('click', (e) => {
        const tarjeta = e.target.closest('.week-day');
        if (!tarjeta || tarjeta.classList.contains('week-day--vacio')) return;
        fecha.value = tarjeta.dataset.fecha;
        cambiarVista('dia');
    });
}
