/**
 * mensaje-detail.page.js — Detalle de un mensaje.
 * Espejo de: MensajeDetailScreen.kt + MensajeDetailViewModel.kt
 *
 * Al abrirlo se marca como leído (si no lo estaba) y ofrece "Responder",
 * que precarga destinatario y asunto vía el caso de uso PrepararRespuesta.
 */
import { Casos }             from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { html, crudo }       from '../components/html.js';
import { topBar, seccion, filaInfo, bloqueError } from '../components/ui.js';
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

                <button class="btn btn--primary btn--block" id="btn-responder">
                    <span class="material-icons">reply</span>
                    <span class="btn__label">Responder</span>
                </button>
            </div>
        </div>`;
}

export async function init() {
    if (!mensaje) return;

    // Marcar como leído. Si falla, no interrumpe la lectura (igual que en Android).
    await Casos.marcarMensajeLeido.ejecutar(mensaje);

    const responder = () => {
        const borrador = Casos.prepararRespuesta.ejecutar(mensaje);
        navegar('compose-mensaje', { borrador });
    };

    document.getElementById('btn-responder')?.addEventListener('click', responder);
    document.getElementById('btn-responder-top')?.addEventListener('click', responder);
}
