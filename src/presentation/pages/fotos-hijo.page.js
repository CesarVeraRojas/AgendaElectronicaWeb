/**
 * fotos-hijo.page.js — Galería de fotos (rol padre).
 * Espejo de: FotosHijoScreen.kt + FotosHijoViewModel.kt
 *
 * Replica las tres funciones de la app: fecha legible ("9 de marzo de 2026"),
 * vista a pantalla completa al pulsar, y descarga del archivo.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError } from '../components/ui.js';
import { fechaLarga }       from '../components/formato.js';
import { abrirVisorFoto }   from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Fotos de mis Hijos', volverA: 'menu' }))}
            <div class="page-content" id="galeria"></div>
        </div>`;
}

export async function init() {
    const cont   = document.getElementById('galeria');
    const sesion = Casos.obtenerSesion.ejecutar();

    cont.innerHTML = spinner('Cargando fotos…');

    let grupos = [];
    try {
        grupos = await Casos.obtenerFotosDeHijos.ejecutar(sesion);
    } catch (e) {
        cont.innerHTML = bloqueError(e.message);
        return;
    }

    const hayFotos = grupos.some(g => g.fotos.length > 0);
    if (!hayFotos) {
        cont.innerHTML = estadoVacio('Todavía no hay fotos publicadas.', 'photo_library');
        return;
    }

    cont.innerHTML = grupos.map(grupo => html`
        <section class="gallery-group">
            <h2 class="gallery-group__title">${grupo.nombreHijo}</h2>
            <div class="gallery-grid">
                ${crudo(grupo.fotos.map(f => `
                    <figure class="photo" data-url="${esc(f.fotoUrl)}">
                        <img class="photo__img" src="${esc(f.fotoUrl)}" alt="Foto de ${esc(grupo.nombreHijo)}" loading="lazy" />
                        <figcaption class="photo__caption">Cargada el: ${esc(fechaLarga(f.fechaSubida))}</figcaption>
                    </figure>`).join(''))}
            </div>
        </section>`).join('');

    cont.querySelectorAll('.photo').forEach(fig => {
        fig.addEventListener('click', () => {
            const url = fig.dataset.url;
            abrirVisorFoto(url, url.split('/').pop() || 'foto.jpg');
        });
    });
}
