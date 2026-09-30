/**
 * circulares.page.js — Las circulares del jardín (BL-70).
 * Espejo de: CircularesScreen.kt + CircularesViewModel.kt
 *
 * La misma pantalla para los tres roles; cambia lo que se ve en cada tarjeta:
 *   familia      un punto en las que aún no ha abierto
 *   director     el acuse, "Leída por 12 de 20 familias", y el botón de publicar
 *   profesional  sólo la lista, para saber qué se les dijo a las familias
 *
 * Qué circulares ve cada uno lo decide el servidor. Las reglas de lectura
 * viven en domain/entities/Circular.js, compartidas con Android.
 */
import { Casos }            from '../../core/container.js';
import { navegar }          from '../router/index.js';
import { Rol }              from '../../domain/entities/Sesion.js';
import { textoDestino, textoAcuseCircular, textoSinCirculares, juntarCirculares } from '../../domain/entities/Circular.js';
import { textoDelDia }      from '../../domain/entities/FotoDelColegio.js';
import { html, crudo }      from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError, botonSecundario } from '../components/ui.js';
import { avisoError }       from '../components/avisos.js';

let estado = { circulares: [], hoy: null, hayMas: false, siguiente: null };

export function render() {
    estado = { circulares: [], hoy: null, hayMas: false, siguiente: null };
    const esDirector = Casos.obtenerSesion.ejecutar()?.userType === Rol.DIRECTOR;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Circulares', volverA: 'menu' }))}
            <div class="page-content">
                <div id="lista-circulares"></div>
                <div id="mas" class="gallery-more"></div>
            </div>
            ${crudo(esDirector ? `
                <button class="fab fab--extendida" id="btn-nueva" title="Nueva circular" aria-label="Nueva circular">
                    <span class="material-icons">add</span><span>Nueva circular</span>
                </button>` : '')}
        </div>`;
}

function tarjeta(c, hoy, esDirector) {
    const sinLeer = c.estaSinLeer();
    const todas   = esDirector && c.totalDestinatarios > 0 && c.totalLeidas >= c.totalDestinatarios;
    const acuse   = esDirector ? html`
        <span class="msg-card__read${todas ? ' msg-card__read--done' : ''}">
            <span class="material-icons">${todas ? 'done_all' : 'schedule'}</span>${textoAcuseCircular({
                total: c.totalDestinatarios ?? 0, leidas: c.totalLeidas ?? 0 })}
        </span>` : '';

    return html`
        <article class="msg-card${sinLeer ? ' msg-card--unread' : ''}" data-id="${c.id}">
            <div class="msg-card__body">
                <p class="msg-card__who">${textoDestino(c.grupoNombre)}</p>
                <p class="msg-card__subject">${c.titulo}</p>
                <p class="msg-card__date">${textoDelDia(c.dia, hoy)} · ${c.hora}</p>
                ${crudo(acuse)}
            </div>
            ${crudo(c.tieneAdjunto() ? `<span class="material-icons msg-card__clip">${c.adjuntoTipo === 'pdf' ? 'picture_as_pdf' : 'image'}</span>` : '')}
            ${crudo(sinLeer ? '<span class="msg-card__dot" aria-label="Sin leer"></span>' : '')}
        </article>`;
}

export async function init() {
    const sesion     = Casos.obtenerSesion.ejecutar();
    const esDirector = sesion?.userType === Rol.DIRECTOR;
    const lista      = document.getElementById('lista-circulares');
    const mas        = document.getElementById('mas');

    const pintar = () => {
        lista.innerHTML = estado.circulares.length
            ? estado.circulares.map(c => tarjeta(c, estado.hoy, esDirector)).join('')
            : estadoVacio(textoSinCirculares(esDirector), 'campaign');
        mas.innerHTML = estado.hayMas
            ? botonSecundario({ id: 'btn-mas', texto: 'Cargar más circulares', icono: 'expand_more', ancho: true })
            : '';
    };

    const cargar = async (continuar = false) => {
        if (continuar) mas.innerHTML = spinner('Cargando más circulares…');
        else lista.innerHTML = spinner('Cargando circulares…');
        try {
            const pagina = await Casos.obtenerCirculares.ejecutar({ antesDe: continuar ? estado.siguiente : null });
            estado = {
                circulares: juntarCirculares(continuar ? estado.circulares : [], pagina.circulares),
                hoy:        pagina.hoy,
                hayMas:     pagina.hayMas,
                siguiente:  pagina.siguiente,
            };
            pintar();
        } catch (e) {
            if (continuar) { avisoError(e.message); pintar(); }
            else lista.innerHTML = bloqueError(e.message);
        }
    };

    lista.addEventListener('click', (e) => {
        const card = e.target.closest('.msg-card');
        if (!card) return;
        const circular = estado.circulares.find(c => c.id === Number(card.dataset.id));
        if (circular) navegar('circular', { circular, hoy: estado.hoy });
    });
    mas.addEventListener('click', (e) => {
        if (e.target.closest('#btn-mas')) cargar(true);
    });
    document.getElementById('btn-nueva')?.addEventListener('click', () => navegar('publicar-circular'));

    await cargar();
}
