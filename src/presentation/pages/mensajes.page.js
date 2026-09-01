/**
 * mensajes.page.js — Bandeja de mensajes.
 * Espejo de: MensajesScreen.kt + MensajesViewModel.kt
 *
 * Réplica de las reglas de la app:
 *   - Pestañas Recibidos / Enviados.
 *   - Sólo los recibidos pueden aparecer como no leídos (negrita + punto azul).
 *   - Al volver del detalle la lista se recarga, para que el mensaje recién
 *     leído deje de figurar como no leído (corrección hecha en Android).
 */
import { Casos }              from '../../core/container.js';
import { navegar }            from '../router/index.js';
import { Bandeja }            from '../../domain/entities/Mensaje.js';
import { html, esc, crudo }   from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError } from '../components/ui.js';
import { fechaHora }          from '../components/formato.js';

let bandejaActiva = Bandeja.RECIBIDOS;

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Mensajes', volverA: 'menu' }))}
            <div class="tabs">
                <button class="tab tab--active" data-bandeja="${Bandeja.RECIBIDOS}">Recibidos</button>
                <button class="tab"             data-bandeja="${Bandeja.ENVIADOS}">Enviados</button>
            </div>
            <div class="page-content" id="lista-mensajes"></div>
            <button class="fab" id="btn-nuevo" title="Nuevo mensaje" aria-label="Nuevo mensaje">
                <span class="material-icons">add</span>
            </button>
        </div>`;
}

function tarjetaMensaje(mensaje, esRecibida) {
    const noLeido = mensaje.esNoLeido(esRecibida);
    const quien   = esRecibida
        ? `De: ${mensaje.remitenteNombre ?? 'Desconocido'}`
        : `Para: ${mensaje.destinatarioNombre ?? 'Desconocido'}`;

    return html`
        <article class="msg-card${noLeido ? ' msg-card--unread' : ''}" data-id="${mensaje.id}">
            <div class="msg-card__body">
                <p class="msg-card__who">${quien}</p>
                <p class="msg-card__subject">${mensaje.asunto}</p>
                <p class="msg-card__date">${fechaHora(mensaje.fechaEnvio)}</p>
            </div>
            ${crudo(mensaje.tieneAdjunto() ? '<span class="material-icons msg-card__clip">attach_file</span>' : '')}
            ${crudo(noLeido ? '<span class="msg-card__dot" aria-label="No leído"></span>' : '')}
        </article>`;
}

async function cargar() {
    const contenedor = document.getElementById('lista-mensajes');
    contenedor.innerHTML = spinner('Cargando mensajes…');

    const sesion = Casos.obtenerSesion.ejecutar();
    try {
        const mensajes  = await Casos.obtenerMensajes.ejecutar(sesion, bandejaActiva);
        const esRecibida = bandejaActiva === Bandeja.RECIBIDOS;

        if (!mensajes.length) {
            contenedor.innerHTML = estadoVacio(
                esRecibida ? 'No hay mensajes recibidos.' : 'No hay mensajes enviados.',
                'mail_outline',
            );
            return;
        }

        contenedor.innerHTML = mensajes.map(m => tarjetaMensaje(m, esRecibida)).join('');

        contenedor.querySelectorAll('.msg-card').forEach(card => {
            card.addEventListener('click', () => {
                const mensaje = mensajes.find(m => String(m.id) === card.dataset.id);
                navegar('mensaje-detail', { mensaje, esRecibida });
            });
        });
    } catch (e) {
        contenedor.innerHTML = bloqueError(e.message);
    }
}

export async function init() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
            tab.classList.add('tab--active');
            bandejaActiva = tab.dataset.bandeja;
            cargar();
        });
    });

    document.getElementById('btn-nuevo').addEventListener('click', () => navegar('compose-mensaje'));

    await cargar();
}
