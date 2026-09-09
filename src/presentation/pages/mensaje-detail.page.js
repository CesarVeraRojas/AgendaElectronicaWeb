/**
 * mensaje-detail.page.js — Detalle de un mensaje.
 * Espejo de: MensajeDetailScreen.kt + MensajeDetailViewModel.kt
 *
 * Al abrirlo se marca como leído (si no lo estaba) y ofrece "Responder",
 * que precarga destinatario y asunto vía el caso de uso PrepararRespuesta.
 *
 * Si el mensaje lo envié yo, debajo aparece el estado de lectura: quién de los
 * destinatarios lo ha abierto ya (BL-46). Se carga después de pintar la
 * pantalla, para no retrasar la lectura del mensaje.
 */
import { Casos }             from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { html, esc, crudo }  from '../components/html.js';
import { topBar, seccion, filaInfo, spinner, bloqueError } from '../components/ui.js';
import { fechaHora }         from '../components/formato.js';

let mensaje = null;

export function render() {
    mensaje = EstadoRuta.mensaje ?? null;

    if (!mensaje) {
        return html`
            <div class="page">
                ${crudo(topBar({ titulo: 'Detalle del Mensaje', volverA: 'mensajes' }))}
                <div class="page-content">${crudo(bloqueError('No se encontró el mensaje. Vuelva a la bandeja.'))}</div>
            </div>`;
    }

    const adjunto = mensaje.tieneAdjunto()
        ? `<a class="btn btn--outlined btn--block" href="${mensaje.adjuntoUrl}" target="_blank" rel="noopener">
               <span class="material-icons">attach_file</span>
               <span class="btn__label">Ver adjunto</span>
           </a>`
        : '';

    return html`
        <div class="page">
            ${crudo(topBar({
                titulo: 'Detalle del Mensaje',
                volverA: 'mensajes',
                acciones: [{ id: 'btn-responder-top', icono: 'reply', titulo: 'Responder' }],
            }))}
            <div class="page-content">
                ${crudo(seccion('', [
                    filaInfo('De:',     mensaje.remitenteNombre ?? 'Desconocido'),
                    filaInfo('Para:',   mensaje.destinatarioNombre ?? 'Desconocido'),
                    filaInfo('Asunto:', mensaje.asunto),
                    filaInfo('Fecha:',  fechaHora(mensaje.fechaEnvio)),
                ].join('')))}

                ${crudo(adjunto)}

                <section class="card">
                    <div class="card__body msg-body">${mensaje.mensaje}</div>
                </section>

                <div id="estado-lectura"></div>

                <button class="btn btn--primary btn--block" id="btn-responder">
                    <span class="material-icons">reply</span>
                    <span class="btn__label">Responder</span>
                </button>
            </div>
        </div>`;
}

/** Una línea por destinatario, con su estado. */
function filaLectura(destinatario) {
    const leido = destinatario.haLeido();
    return html`
        <div class="read-row">
            <span class="material-icons read-row__icon${leido ? ' read-row__icon--done' : ''}">
                ${leido ? 'done_all' : 'schedule'}
            </span>
            <span class="read-row__name">${destinatario.nombre}</span>
            <span class="read-row__state">${leido ? 'Leído' : 'Sin leer'}</span>
        </div>`;
}

/**
 * Con un solo destinatario el recuento sobra: basta con decir si lo leyó.
 */
function resumenLectura({ total, leidos, todosLeidos }) {
    if (total === 1) return leidos === 1 ? 'Leído' : 'Sin leer';
    if (todosLeidos) return `Leído por todos (${total})`;
    return `Leído por ${leidos} de ${total}`;
}

/** Carga y pinta el estado de lectura. Sólo se llama si el mensaje es mío. */
async function cargarEstadoLectura() {
    const contenedor = document.getElementById('estado-lectura');
    if (!contenedor) return;

    contenedor.innerHTML = spinner('Consultando estado de lectura…');
    try {
        const { destinatarios, resumen } = await Casos.obtenerEstadoLectura.ejecutar(mensaje.id);

        if (!destinatarios.length) {
            contenedor.innerHTML = '';
            return;
        }

        contenedor.innerHTML = seccion('Estado de lectura', [
            `<p class="read-summary">${esc(resumenLectura(resumen))}</p>`,
            ...destinatarios.map(filaLectura),
        ].join(''));
    } catch (e) {
        // No es información crítica: si falla, se avisa sin estropear la pantalla.
        contenedor.innerHTML = bloqueError(`No se pudo consultar el estado de lectura. ${e.message}`);
    }
}

export async function init() {
    if (!mensaje) return;

    // Marcar como leído. Si falla, no interrumpe la lectura (igual que en Android).
    await Casos.marcarMensajeLeido.ejecutar(mensaje);

    const sesion = Casos.obtenerSesion.ejecutar();
    if (Casos.obtenerEstadoLectura.esRemitente(mensaje, sesion)) {
        cargarEstadoLectura();
    }

    const responder = () => {
        const borrador = Casos.prepararRespuesta.ejecutar(mensaje);
        navegar('compose-mensaje', { borrador });
    };

    document.getElementById('btn-responder')?.addEventListener('click', responder);
    document.getElementById('btn-responder-top')?.addEventListener('click', responder);
}
