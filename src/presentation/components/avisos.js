/**
 * avisos.js — Notificaciones efímeras y visor de imágenes.
 * Espejo de Toast / Snackbar de Android y del Dialog a pantalla completa
 * de FotosHijoScreen.kt.
 */
import { esc } from './html.js';

let contenedorAvisos = null;

function asegurarContenedor() {
    if (!contenedorAvisos || !document.body.contains(contenedorAvisos)) {
        contenedorAvisos = document.createElement('div');
        contenedorAvisos.className = 'snackbar-host';
        document.body.appendChild(contenedorAvisos);
    }
    return contenedorAvisos;
}

/** Espejo de Toast.makeText(...).show() */
export function aviso(mensaje, tipo = 'info', ms = 3500) {
    const host = asegurarContenedor();
    const el = document.createElement('div');
    el.className = `snackbar snackbar--${tipo}`;
    el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    el.innerHTML = `
        <span class="material-icons">${esc(tipo === 'error' ? 'error_outline' : tipo === 'exito' ? 'check_circle' : 'info')}</span>
        <span class="snackbar__text">${esc(mensaje)}</span>`;
    host.appendChild(el);

    requestAnimationFrame(() => el.classList.add('snackbar--visible'));
    setTimeout(() => {
        el.classList.remove('snackbar--visible');
        setTimeout(() => el.remove(), 300);
    }, ms);
}

export const avisoExito = (m) => aviso(m, 'exito');
export const avisoError = (m) => aviso(m, 'error');

/**
 * Visor de foto a pantalla completa con descarga.
 * Espejo del Dialog + downloadImage() de FotosHijoScreen.kt.
 */
export function abrirVisorFoto(url, nombreArchivo = 'foto.jpg') {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
        <div class="lightbox__toolbar">
            <a class="lightbox__btn" href="${esc(url)}" download="${esc(nombreArchivo)}"
               target="_blank" rel="noopener" title="Descargar">
                <span class="material-icons">download</span>
            </a>
            <button class="lightbox__btn" data-cerrar title="Cerrar">
                <span class="material-icons">close</span>
            </button>
        </div>
        <img class="lightbox__img" src="${esc(url)}" alt="Foto ampliada" />`;

    const cerrar = () => {
        overlay.remove();
        document.removeEventListener('keydown', alPulsarTecla);
    };
    const alPulsarTecla = (e) => { if (e.key === 'Escape') cerrar(); };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('[data-cerrar]')) cerrar();
    });
    document.addEventListener('keydown', alPulsarTecla);
    document.body.appendChild(overlay);
}
