/**
 * asistencia-hijo.page.js — Asistencia del hijo (rol padre), sólo lectura.
 * Espejo de: AsistenciaHijoScreen.kt + AsistenciaHijoViewModel.kt
 *
 * El backend valida en get_asistencias_por_hijo.php que el estudiante sea hijo
 * del padre autenticado, igual que hace con las observaciones.
 */
import { Casos }            from '../../core/container.js';
import { mesAnterior, mesSiguiente } from '../../domain/usecases/ObtenerAsistenciaDeHijo.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, spinner, estadoVacio, bloqueError, campoSelect } from '../components/ui.js';
import { fechaLarga, mesYAnio } from '../components/formato.js';
import { avisoError }       from '../components/avisos.js';

/** Mes visible en la pantalla. Se fija al mes en curso cada vez que se entra. */
let mesVisible = { anio: 0, mes: 0 };

function mesDeHoy() {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
}

/** No tiene sentido avanzar más allá del mes en curso: aún no hay registros. */
function esFuturo({ anio, mes }) {
    const hoy = mesDeHoy();
    return anio > hoy.anio || (anio === hoy.anio && mes > hoy.mes);
}

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Asistencia de tu Hij@', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('', campoSelect({ id: 'hijo', etiqueta: 'Hij@', opciones: [], placeholder: 'Cargando…', deshabilitado: true })))}

                <div class="month-nav">
                    <button class="topbar__icon month-nav__btn" id="mes-anterior" aria-label="Mes anterior">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <span class="month-nav__label" id="mes-actual"></span>
                    <button class="topbar__icon month-nav__btn" id="mes-siguiente" aria-label="Mes siguiente">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>

                <div id="resumen-asistencia"></div>
                <div id="lista-asistencia"></div>
            </div>
        </div>`;
}

function pintarResumen(resumen) {
    return html`
        <section class="card att-summary">
            <div class="att-summary__item">
                <span class="att-summary__num">${resumen.asistio}</span>
                <span class="att-summary__label">Asistio</span>
            </div>
            <div class="att-summary__item">
                <span class="att-summary__num">${resumen.tarde}</span>
                <span class="att-summary__label">Tarde</span>
            </div>
            <div class="att-summary__item">
                <span class="att-summary__num">${resumen.ausente}</span>
                <span class="att-summary__label">Ausente</span>
            </div>
        </section>`;
}

function pintarRegistros(registros) {
    return registros.map(r => html`
        <article class="card obs-card">
            <div class="obs-card__head">
                <span class="obs-card__date">${fechaLarga(r.fecha)}</span>
                <span class="badge badge--${String(r.estado).toLowerCase()}">${r.etiquetaEstado}</span>
            </div>
            ${crudo(r.profesionalNombre ? `<p class="obs-card__author">— ${esc(r.profesionalNombre)}</p>` : '')}
        </article>`).join('');
}

export async function init() {
    const sesion   = Casos.obtenerSesion.ejecutar();
    const selHijo  = document.getElementById('hijo');
    const etiqueta = document.getElementById('mes-actual');
    const anterior = document.getElementById('mes-anterior');
    const siguiente= document.getElementById('mes-siguiente');
    const resumen  = document.getElementById('resumen-asistencia');
    const cont     = document.getElementById('lista-asistencia');

    mesVisible = mesDeHoy();

    const cargar = async () => {
        etiqueta.textContent = mesYAnio(mesVisible.anio, mesVisible.mes);
        siguiente.disabled = esFuturo(mesSiguiente(mesVisible));

        if (!selHijo.value) return;
        resumen.innerHTML = '';
        cont.innerHTML = spinner('Cargando asistencia…');
        try {
            const { registros, resumen: totales } = await Casos.obtenerAsistenciaDeHijo.ejecutar(selHijo.value, mesVisible);
            resumen.innerHTML = pintarResumen(totales);
            cont.innerHTML = registros.length
                ? pintarRegistros(registros)
                : estadoVacio('No hay registros de asistencia en este mes.', 'event_busy');
        } catch (e) {
            resumen.innerHTML = '';
            cont.innerHTML = bloqueError(e.message);
        }
    };

    try {
        const hijos = await Casos.obtenerHijos.ejecutar(sesion);
        if (!hijos.length) {
            selHijo.innerHTML = `<option value="">Sin hijos asociados</option>`;
            etiqueta.textContent = mesYAnio(mesVisible.anio, mesVisible.mes);
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
    anterior.addEventListener('click', () => { mesVisible = mesAnterior(mesVisible); cargar(); });
    siguiente.addEventListener('click', () => {
        const proximo = mesSiguiente(mesVisible);
        if (esFuturo(proximo)) return;
        mesVisible = proximo;
        cargar();
    });
}
