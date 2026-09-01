/**
 * menu.page.js — Menú principal.
 * Espejo de: MenuScreen.kt + MenuViewModel.kt
 *
 * Las opciones NO se deciden aquí: las calcula el caso de uso
 * ObtenerMenuPorRol, que replica la lógica de roles de MenuScreen.kt.
 */
import { Casos }           from '../../core/container.js';
import { navegar }         from '../router/index.js';
import { html, esc, crudo }from '../components/html.js';
import { topBar }          from '../components/ui.js';
import { avisoError }      from '../components/avisos.js';

let sesion = null;

export function render() {
    sesion = Casos.obtenerSesion.ejecutar();
    const opciones = Casos.obtenerMenuPorRol.ejecutar(sesion);

    const tarjetas = opciones.map(op => `
        <button class="menu-card menu-card--${esc(op.color)}" data-ruta="${esc(op.ruta)}">
            <span class="material-icons menu-card__icon">${esc(op.icono)}</span>
            <span class="menu-card__label">${esc(op.texto)}</span>
        </button>`).join('');

    const pie = Casos.obtenerMenuPorRol.debeMostrarPieColegio(sesion)
        ? '<footer class="menu-footer" id="menu-footer"></footer>'
        : '';

    return html`
        <div class="page">
            ${crudo(topBar({
                titulo: 'Menú Principal',
                acciones: [{ id: 'btn-logout', icono: 'logout', titulo: 'Cerrar sesión' }],
            }))}
            <div class="page-content menu-content">
                <img class="menu-banner" src="assets/agenda_kids.jpeg" alt="" />
                <h2 class="menu-greeting">Bienvenido, ${sesion?.nombres ?? ''}</h2>
                <div class="menu-grid">${crudo(tarjetas)}</div>
                ${crudo(pie)}
            </div>
        </div>`;
}

export async function init() {
    // Navegación de las tarjetas
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => navegar(card.dataset.ruta));
    });

    // Cerrar sesión
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        Casos.cerrarSesion.ejecutar();
        navegar('login');
    });

    // Pie con datos del colegio — sólo para padre y profesional (regla de MenuScreen.kt)
    const pie = document.getElementById('menu-footer');
    if (pie && sesion?.colegioId) {
        try {
            const colegio = await Casos.obtenerColegio.ejecutar(sesion.colegioId);
            pie.innerHTML = html`
                <p class="menu-footer__name">${colegio.nombre}</p>
                <p class="menu-footer__addr">${colegio.direccion}</p>`;
        } catch (e) {
            pie.innerHTML = html`<p class="menu-footer__addr">No se pudieron cargar los datos del colegio.</p>`;
        }
    }
}
