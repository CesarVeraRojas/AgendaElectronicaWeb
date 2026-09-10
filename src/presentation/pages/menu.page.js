/**
 * menu.page.js — Menú principal.
 * Espejo de: MenuScreen.kt + MenuViewModel.kt
 *
 * Las opciones NO se deciden aquí: las calcula el caso de uso
 * ObtenerMenuPorRol, que replica la lógica de roles de MenuScreen.kt.
 */
import { Casos }           from '../../core/container.js';
import { Rol }             from '../../domain/entities/Sesion.js';
import { navegar }         from '../router/index.js';
import { html, esc, crudo }from '../components/html.js';
import { topBar }          from '../components/ui.js';
import { avisoError }      from '../components/avisos.js';
import { textoContador }   from '../../domain/entities/Novedad.js';
import {
    novedadesPendientes, suscribir, marcarVistas, olvidarNovedades,
    avisosDisponibles, permisoAvisos, pedirPermisoAvisos,
} from '../novedades/sondeo.js';

let sesion = null;
let dejarDeEscuchar = null;

/** El router lo llama al salir de la pantalla: aquí se suelta la suscripción. */
export function destruir() {
    dejarDeEscuchar?.();
    dejarDeEscuchar = null;
}

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
                <div id="menu-novedades"></div>
                <div class="menu-grid">${crudo(tarjetas)}</div>
                ${crudo(pie)}
            </div>
        </div>`;
}

/** Tarjeta de novedades: lo que ha pasado y aún no se ha mirado. */
function pintarNovedades(novedades) {
    const zona = document.getElementById('menu-novedades');
    if (!zona) return;

    const puedePedirPermiso = avisosDisponibles() && permisoAvisos() === 'default';

    if (!novedades.length) {
        // Sin novedades sólo tiene sentido ofrecer que se activen los avisos.
        zona.innerHTML = puedePedirPermiso
            ? html`<section class="novedades novedades--oferta">
                       <span class="material-icons">notifications_none</span>
                       <p class="novedades__texto">Activa los avisos para enterarte sin entrar a mirar.</p>
                       <button class="btn btn--outlined" id="btn-permiso-avisos">Activar</button>
                   </section>`
            : '';
        enlazarNovedades();
        return;
    }

    const filas = novedades.slice(0, 5).map(n => html`
        <button class="novedades__fila" data-ruta="${n.rutaDestino()}">
            <span class="material-icons">${n.tipo === 'mensaje' ? 'mail' : n.tipo === 'agenda' ? 'event_note' : 'sticky_note_2'}</span>
            <span class="novedades__fila-texto">
                <strong>${n.titulo}</strong>
                <em>${n.texto}</em>
            </span>
        </button>`).join('');

    const resto = novedades.length > 5
        ? `<p class="novedades__resto">y ${novedades.length - 5} más</p>`
        : '';

    zona.innerHTML = html`
        <section class="novedades">
            <header class="novedades__cab">
                <span class="material-icons">notifications_active</span>
                <p class="novedades__texto">${textoContador(novedades.length)}</p>
                <button class="btn btn--text" id="btn-vistas">Marcar como vistas</button>
            </header>
            ${crudo(filas)}
            ${crudo(resto)}
            ${crudo(puedePedirPermiso
                ? '<button class="btn btn--outlined btn--block" id="btn-permiso-avisos">Avisarme aunque no esté mirando</button>'
                : '')}
        </section>`;

    enlazarNovedades();
}

function enlazarNovedades() {
    document.querySelectorAll('.novedades__fila').forEach(fila => {
        fila.addEventListener('click', () => {
            marcarVistas();
            navegar(fila.dataset.ruta);
        });
    });

    document.getElementById('btn-vistas')?.addEventListener('click', marcarVistas);

    document.getElementById('btn-permiso-avisos')?.addEventListener('click', async () => {
        await pedirPermisoAvisos();
        pintarNovedades(novedadesPendientes());
    });
}

export async function init() {
    // Navegación de las tarjetas
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => navegar(card.dataset.ruta));
    });

    // Novedades: lo que haya ahora y lo que vaya llegando mientras se mira el menú
    pintarNovedades(novedadesPendientes());
    dejarDeEscuchar = suscribir(pintarNovedades);

    // Cerrar sesión
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        olvidarNovedades();
        Casos.cerrarSesion.ejecutar();
        navegar('login');
    });

    // Pie con datos del colegio — sólo para padre y profesional (regla de MenuScreen.kt)
    const pie = document.getElementById('menu-footer');
    if (!pie) return;

    try {
        const colegioId = await resolverColegioId(sesion);
        if (!colegioId) {
            pie.hidden = true;          // sin colegio no se pinta un recuadro vacío
            return;
        }
        const colegio = await Casos.obtenerColegio.ejecutar(colegioId);
        pie.innerHTML = html`
            <p class="menu-footer__name">${colegio.nombre}</p>
            <p class="menu-footer__addr">${colegio.direccion}</p>`;
    } catch (e) {
        pie.innerHTML = html`<p class="menu-footer__addr">No se pudieron cargar los datos del colegio.</p>`;
    }
}

/**
 * Espejo de la primera mitad de MenuViewModel.fetchColegioDetails().
 *
 * `login.php` selecciona `NULL as colegio_id` para los padres (línea 78), así que la
 * sesión de un padre nunca trae colegio. Android lo resuelve pidiendo sus hijos y
 * tomando el colegio del primero; aquí se hace igual.
 */
async function resolverColegioId(sesion) {
    if (sesion?.colegioId) return sesion.colegioId;
    if (sesion?.userType !== Rol.PADRE) return null;

    const hijos = await Casos.obtenerHijos.ejecutar(sesion);
    return hijos.find(h => h.colegioId)?.colegioId ?? null;
}
