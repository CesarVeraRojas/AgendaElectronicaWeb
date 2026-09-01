/**
 * compose-mensaje.page.js — Redacción de un mensaje.
 * Espejo de: ComposeMensajeScreen.kt + ComposeMensajeViewModel.kt
 *
 * Soporta adjunto opcional (FormData, equivalente al Multipart de Retrofit) y
 * precarga de respuesta cuando se llega desde el detalle de un mensaje.
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { NuevoMensaje }        from '../../domain/entities/Mensaje.js';
import { html, esc, crudo }    from '../components/html.js';
import { topBar, campoTexto, campoArea, botonPrimario, botonSecundario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

/** Borrador vivo de la pantalla. Persiste al ir a elegir destinatarios y volver. */
let borrador = new NuevoMensaje({});
let adjunto  = null;

export function render() {
    // Al llegar desde "Responder" o desde el selector de destinatarios
    if (EstadoRuta.borrador) {
        borrador = EstadoRuta.borrador;
        adjunto  = borrador.adjunto ?? null;
    } else if (!EstadoRuta.conservarBorrador) {
        borrador = new NuevoMensaje({});
        adjunto  = null;
    }

    const nombres = borrador.destinatarios.map(d => d.displayName).join(', ');

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Nuevo Mensaje', volverA: 'mensajes' }))}
            <div class="page-content">
                <div class="field">
                    <label class="field__label" for="destinatarios">Para *</label>
                    <button class="field__input field__picker" id="destinatarios" type="button">
                        <span class="${nombres ? '' : 'field__placeholder'}">${nombres || 'Seleccionar destinatarios…'}</span>
                        <span class="material-icons">arrow_drop_down</span>
                    </button>
                </div>

                ${crudo(campoTexto({ id: 'asunto',  etiqueta: 'Asunto', valor: borrador.asunto, requerido: true }))}
                ${crudo(campoArea({ id: 'cuerpo', etiqueta: 'Mensaje', valor: borrador.mensaje, filas: 8, requerido: true }))}

                <input type="file" id="input-adjunto" hidden />
                <div id="adjunto-info" class="attachment" ${crudo(adjunto ? '' : 'hidden')}>
                    <span class="material-icons">attach_file</span>
                    <span class="attachment__name" id="adjunto-nombre">${adjunto?.name ?? ''}</span>
                    <button class="attachment__remove" id="btn-quitar-adjunto" title="Quitar adjunto">
                        <span class="material-icons">close</span>
                    </button>
                </div>

                <div class="row-actions">
                    ${crudo(botonSecundario({ id: 'btn-adjuntar', texto: 'Adjuntar', icono: 'attach_file' }))}
                    ${crudo(botonPrimario({ id: 'btn-enviar', texto: 'Enviar', icono: 'send', ancho: false }))}
                </div>
            </div>
        </div>`;
}

function sincronizarBorrador() {
    borrador.asunto  = document.getElementById('asunto').value;
    borrador.mensaje = document.getElementById('cuerpo').value;
    borrador.adjunto = adjunto;
}

export function init() {
    const inputArchivo = document.getElementById('input-adjunto');
    const infoAdjunto  = document.getElementById('adjunto-info');
    const nombreAdjunto= document.getElementById('adjunto-nombre');
    const btnEnviar    = document.getElementById('btn-enviar');

    // Selector de destinatarios — pantalla aparte, igual que en Android
    document.getElementById('destinatarios').addEventListener('click', () => {
        sincronizarBorrador();
        navegar('seleccionar-destinatarios', { borrador });
    });

    document.getElementById('btn-adjuntar').addEventListener('click', () => inputArchivo.click());

    inputArchivo.addEventListener('change', () => {
        adjunto = inputArchivo.files?.[0] ?? null;
        nombreAdjunto.textContent = adjunto?.name ?? '';
        infoAdjunto.hidden = !adjunto;
    });

    document.getElementById('btn-quitar-adjunto').addEventListener('click', () => {
        adjunto = null;
        inputArchivo.value = '';
        infoAdjunto.hidden = true;
    });

    btnEnviar.addEventListener('click', async () => {
        sincronizarBorrador();
        const sesion = Casos.obtenerSesion.ejecutar();

        btnEnviar.disabled = true;
        try {
            const mensaje = await Casos.enviarMensaje.ejecutar(sesion, borrador);
            avisoExito(mensaje);
            borrador = new NuevoMensaje({});
            adjunto  = null;
            navegar('mensajes');
        } catch (e) {
            avisoError(e.message);
        } finally {
            btnEnviar.disabled = false;
        }
    });
}
