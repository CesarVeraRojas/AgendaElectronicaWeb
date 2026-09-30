/**
 * evento.page.js — Un evento del calendario (BL-76).
 * Espejo de: EventoDetalleScreen.kt
 *
 * Todos pueden "Agregar a mi calendario" (un .ics que abren el teléfono y el
 * computador, sin permisos). Quien puede editarlo —el director, o el
 * profesional que lo creó— ve además "Editar" y "Cancelar evento", con la
 * confirmación en la propia pantalla.
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { textoFechaEvento, textoParaQuien, colorDeEvento, generarIcs,
         TEXTO_CONFIRMAR_CANCELAR_EVENTO } from '../../domain/entities/Evento.js';
import { html, crudo }         from '../components/html.js';
import { topBar, filaInfo, bloqueError } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let evento = null;
let calendario = null;

export function render() {
    evento = EstadoRuta.evento ?? null;
    calendario = EstadoRuta.calendario ?? null;
    if (!evento) {
        return html`
            <div class="page">
                ${crudo(topBar({ titulo: 'Evento', volverA: 'eventos' }))}
                <div class="page-content">${crudo(bloqueError('No se encontró el evento. Vuelva al calendario.'))}</div>
            </div>`;
    }
    const hoy = calendario?.hoy ?? null;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Evento', volverA: 'eventos' }))}
            <div class="page-content">
                <section class="card card--section evento-detalle" style="--color-evento: ${colorDeEvento(evento.color)}">
                    <div class="card__body">
                        <span class="evento-chip">${evento.tipoNombre}</span>
                        <h2 class="circ-titulo evento-detalle__titulo">${evento.titulo}</h2>
                        ${crudo(filaInfo('Cuándo:', textoFechaEvento(evento, hoy)))}
                        ${crudo(evento.lugar ? filaInfo('Dónde:', evento.lugar) : '')}
                        ${crudo(filaInfo('Para:', textoParaQuien(evento)))}
                        ${crudo(evento.autor ? filaInfo('Por:', evento.autor) : '')}
                    </div>
                </section>
                ${crudo(evento.descripcion ? html`<section class="card"><div class="card__body msg-body">${evento.descripcion}</div></section>` : '')}
                <button class="btn btn--outlined btn--block" id="btn-ics">
                    <span class="material-icons">event_available</span><span class="btn__label">Agregar a mi calendario</span>
                </button>
                ${crudo(evento.puedeEditar ? html`
                    <div id="acciones-evento">
                        <div data-paso="inicio" class="acciones-fila">
                            <button class="btn btn--outlined btn--block" id="btn-editar">
                                <span class="material-icons">edit</span><span class="btn__label">Editar</span>
                            </button>
                            <button class="btn btn--danger btn--block" id="btn-cancelar-evento">
                                <span class="material-icons">event_busy</span><span class="btn__label">Cancelar evento</span>
                            </button>
                        </div>
                        <div class="lightbox__confirmar" data-paso="confirmar" hidden>
                            <p class="lightbox__aviso">¿Cancelar este evento? ${TEXTO_CONFIRMAR_CANCELAR_EVENTO}</p>
                            <div class="acciones-fila">
                                <button class="btn btn--outlined btn--block" id="btn-no">No</button>
                                <button class="btn btn--danger btn--block" id="btn-si"><span class="btn__label">Sí, cancelar</span></button>
                            </div>
                        </div>
                    </div>` : '')}
            </div>
        </div>`;
}

export function init() {
    if (!evento) return;

    document.getElementById('btn-ics').addEventListener('click', () => {
        const blob = new Blob([generarIcs(evento)], { type: 'text/calendar;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${evento.titulo.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'evento'}.ics`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    if (!evento.puedeEditar) return;

    const inicio = document.querySelector('#acciones-evento [data-paso="inicio"]');
    const confirmar = document.querySelector('#acciones-evento [data-paso="confirmar"]');
    const si = document.getElementById('btn-si');

    document.getElementById('btn-editar').addEventListener('click', () => navegar('editar-evento', { evento, calendario }));
    document.getElementById('btn-cancelar-evento').addEventListener('click', () => { inicio.hidden = true; confirmar.hidden = false; });
    document.getElementById('btn-no').addEventListener('click', () => { confirmar.hidden = true; inicio.hidden = false; });
    si.addEventListener('click', async () => {
        si.disabled = true;
        si.querySelector('.btn__label').textContent = 'Cancelando…';
        try {
            avisoExito(await Casos.administrarEventos.cancelar(evento.id));
            navegar('eventos');
        } catch (e) {
            avisoError(e.message);
            si.disabled = false;
            si.querySelector('.btn__label').textContent = 'Sí, cancelar';
        }
    });
}
