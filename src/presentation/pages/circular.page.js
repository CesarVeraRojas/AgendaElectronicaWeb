/**
 * circular.page.js — Una circular abierta (BL-70).
 * Espejo de: CircularDetalleScreen.kt
 *
 * Al abrirla, si es una familia y no la había leído, se anota la lectura. El
 * director ve además el acuse familia por familia —primero las que faltan— y
 * puede retirarla, con confirmación en la propia pantalla.
 *
 * No hay "Responder": una circular es comunicación oficial del jardín. Quien
 * quiera preguntar algo lo hace por Mensajes.
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { Rol }                 from '../../domain/entities/Sesion.js';
import { textoDestino, textoAdjunto, textoAcuseCircular, ordenarFamilias,
         TEXTO_CONFIRMAR_ELIMINAR_CIRCULAR } from '../../domain/entities/Circular.js';
import { textoDelDia }         from '../../domain/entities/FotoDelColegio.js';
import { html, crudo }         from '../components/html.js';
import { topBar, seccion, filaInfo, spinner, bloqueError } from '../components/ui.js';
import { fechaHora }           from '../components/formato.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let circular = null;
let hoy      = null;

export function render() {
    circular = EstadoRuta.circular ?? null;
    hoy      = EstadoRuta.hoy ?? null;

    if (!circular) {
        return html`
            <div class="page">
                ${crudo(topBar({ titulo: 'Circular', volverA: 'circulares' }))}
                <div class="page-content">${crudo(bloqueError('No se encontró la circular. Vuelva a la lista.'))}</div>
            </div>`;
    }

    const esDirector = Casos.obtenerSesion.ejecutar()?.userType === Rol.DIRECTOR;

    let adjunto = '';
    if (circular.tieneAdjunto()) {
        const imagen = circular.adjuntoTipo === 'imagen'
            ? html`<img class="circ-imagen" src="${circular.adjuntoUrl}" alt="${textoAdjunto(circular)}" loading="lazy" />`
            : '';
        adjunto = html`
            ${crudo(imagen)}
            <a class="btn btn--outlined btn--block" href="${circular.adjuntoUrl}" target="_blank" rel="noopener">
                <span class="material-icons">${circular.adjuntoTipo === 'pdf' ? 'picture_as_pdf' : 'open_in_new'}</span>
                <span class="btn__label">${circular.adjuntoTipo === 'pdf' ? 'Abrir documento' : 'Ver imagen'}: ${textoAdjunto(circular)}</span>
            </a>`;
    }

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Circular', volverA: 'circulares' }))}
            <div class="page-content">
                <section class="card card--section">
                    <h2 class="circ-titulo">${circular.titulo}</h2>
                    <div class="card__body">
                        ${crudo(filaInfo('Para:', textoDestino(circular.grupoNombre)))}
                        ${crudo(filaInfo('Publicada:', `${textoDelDia(circular.dia, hoy)} · ${circular.hora}`))}
                        ${crudo(circular.publicadaPor ? filaInfo('Por:', circular.publicadaPor) : '')}
                    </div>
                </section>

                ${crudo(circular.texto ? html`<section class="card"><div class="card__body msg-body">${circular.texto}</div></section>` : '')}
                ${crudo(adjunto)}

                <div id="acuse"></div>

                ${crudo(esDirector ? html`
                    <div id="retirar">
                        <div data-paso="inicio">
                            <button class="btn btn--danger btn--block" id="btn-retirar">
                                <span class="material-icons">delete</span><span class="btn__label">Retirar circular</span>
                            </button>
                        </div>
                        <div class="lightbox__confirmar" data-paso="confirmar" hidden>
                            <p class="lightbox__aviso">¿Retirar esta circular? ${TEXTO_CONFIRMAR_ELIMINAR_CIRCULAR}</p>
                            <div class="acciones-fila">
                                <button class="btn btn--outlined btn--block" id="btn-cancelar">Cancelar</button>
                                <button class="btn btn--danger btn--block" id="btn-confirmar">
                                    <span class="btn__label">Sí, retirar</span>
                                </button>
                            </div>
                        </div>
                    </div>` : '')}
            </div>
        </div>`;
}

function filaFamilia(f) {
    return html`
        <div class="read-row">
            <span class="material-icons read-row__icon${f.leida ? ' read-row__icon--done' : ''}">${f.leida ? 'done_all' : 'schedule'}</span>
            <span class="read-row__name">${f.nombre}<small class="read-row__sub">${f.estudiantes.join(', ')}</small></span>
            <span class="read-row__state">${f.leida ? `Leída ${fechaHora(f.leidaEn)}` : 'Pendiente'}</span>
        </div>`;
}

async function cargarAcuse() {
    const cont = document.getElementById('acuse');
    cont.innerHTML = spinner('Consultando quién la leyó…');
    try {
        const lectura = await Casos.obtenerCirculares.lectura(circular.id);
        cont.innerHTML = seccion('Lectura de las familias', [
            html`<p class="read-summary">${textoAcuseCircular({ total: lectura.total, leidas: lectura.leidas })}</p>`,
            ...ordenarFamilias(lectura.destinatarios).map(filaFamilia),
        ].join(''));
    } catch (e) {
        // No es lo principal de la pantalla: se avisa sin estropearla.
        cont.innerHTML = bloqueError(`No se pudo consultar quién la leyó. ${e.message}`);
    }
}

export async function init() {
    if (!circular) return;

    const esDirector = Casos.obtenerSesion.ejecutar()?.userType === Rol.DIRECTOR;
    if (!esDirector) {
        await Casos.marcarCircularLeida.ejecutar(circular);
        return;
    }

    cargarAcuse();

    const inicio    = document.querySelector('#retirar [data-paso="inicio"]');
    const confirmar = document.querySelector('#retirar [data-paso="confirmar"]');
    const btnSi     = document.getElementById('btn-confirmar');

    document.getElementById('btn-retirar').addEventListener('click', () => {
        inicio.hidden = true;
        confirmar.hidden = false;
    });
    document.getElementById('btn-cancelar').addEventListener('click', () => {
        confirmar.hidden = true;
        inicio.hidden = false;
    });
    btnSi.addEventListener('click', async () => {
        btnSi.disabled = true;
        btnSi.querySelector('.btn__label').textContent = 'Retirando…';
        try {
            avisoExito(await Casos.eliminarCircular.ejecutar(circular.id));
            navegar('circulares');
        } catch (e) {
            avisoError(e.message);
            btnSi.disabled = false;
            btnSi.querySelector('.btn__label').textContent = 'Sí, retirar';
        }
    });
}
