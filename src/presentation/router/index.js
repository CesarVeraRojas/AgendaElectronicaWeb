/**
 * router.js — Router SPA por hash.
 * Espejo de: NavRoutes.kt + NavigationHost.kt
 *
 * - Hash routing (#/menu) para funcionar en cualquier hosting estático,
 *   sin configuración del servidor.
 * - Carga diferida de cada pantalla con import() dinámico, equivalente a
 *   cómo NavHost sólo compone la pantalla activa.
 * - EstadoRuta cumple el papel de savedStateHandle: pasar datos entre
 *   pantallas sin serializarlos en la URL.
 */
import { SesionActual } from '../../core/container.js';

/** Registro de rutas. Espejo de las entradas composable() del NavHost. */
const RUTAS = {
    'login':                     () => import('../pages/login.page.js'),
    'menu':                      () => import('../pages/menu.page.js'),
    'mensajes':                  () => import('../pages/mensajes.page.js'),
    'mensaje-detail':            () => import('../pages/mensaje-detail.page.js'),
    'compose-mensaje':           () => import('../pages/compose-mensaje.page.js'),
    'seleccionar-destinatarios': () => import('../pages/seleccionar-destinatarios.page.js'),
    'asistencia':                () => import('../pages/asistencia.page.js'),
    'observaciones':             () => import('../pages/observaciones.page.js'),
    'agenda-diaria':             () => import('../pages/agenda-diaria.page.js'),
    'fotos':                     () => import('../pages/fotos.page.js'),
    'agenda-diaria-hijo':        () => import('../pages/agenda-diaria-hijo.page.js'),
    'observaciones-hijo':        () => import('../pages/observaciones-hijo.page.js'),
    'fotos-hijo':                () => import('../pages/fotos-hijo.page.js'),
    'asistencia-hijo':           () => import('../pages/asistencia-hijo.page.js'),
    'crear-estudiante':          () => import('../pages/crear-estudiante.page.js'),
    'crear-grupo':               () => import('../pages/crear-grupo.page.js'),
    'crear-profesional':         () => import('../pages/crear-profesional.page.js'),
    'asignar-profesional-grupo': () => import('../pages/asignar-profesional-grupo.page.js'),
    'actualizar-datos':          () => import('../pages/actualizar-datos.page.js'),
};

/** Única ruta pública, igual que en Android. */
const RUTAS_PUBLICAS = new Set(['login']);

/**
 * Estado compartido entre pantallas.
 * Espejo de NavBackStackEntry.savedStateHandle.
 */
export const EstadoRuta = {};

function limpiarEstado() {
    Object.keys(EstadoRuta).forEach(k => delete EstadoRuta[k]);
}

/** Pila de navegación, para que "volver" se comporte como popBackStack(). */
const pila = [];

let paginaActual = null;

/** Navega a una ruta, opcionalmente pasando datos. */
export function navegar(ruta, estado = {}) {
    limpiarEstado();
    Object.assign(EstadoRuta, estado);
    window.location.hash = `#/${ruta}`;
}

/** Espejo de navController.popBackStack(). */
export function volver(rutaPorDefecto = 'menu') {
    pila.pop();                       // la actual
    const anterior = pila.pop();      // la previa
    navegar(anterior ?? rutaPorDefecto);
}

function nombreDeRuta() {
    const hash = window.location.hash || '#/login';
    return hash.replace(/^#\/?/, '').split('?')[0] || 'login';
}

async function resolver() {
    const raiz = document.getElementById('app');
    if (!raiz) return;

    let ruta = nombreDeRuta();

    // Guard: sin sesión sólo se permite el login; con sesión, el login redirige al menú.
    const haySesion = SesionActual.existe();
    if (!RUTAS_PUBLICAS.has(ruta) && !haySesion) {
        window.location.hash = '#/login';
        return;
    }
    if (ruta === 'login' && haySesion) {
        window.location.hash = '#/menu';
        return;
    }
    if (!RUTAS[ruta]) ruta = haySesion ? 'menu' : 'login';

    // Deja que la pantalla anterior libere lo suyo (timers, listeners globales)
    if (paginaActual?.destruir) {
        try { paginaActual.destruir(); } catch (e) { console.error(e); }
    }

    raiz.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

    try {
        const modulo = await RUTAS[ruta]();
        paginaActual = modulo;

        raiz.innerHTML = modulo.render ? modulo.render() : '';
        if (modulo.init) await modulo.init();

        // Botones de "volver" declarados por los componentes
        raiz.querySelectorAll('[data-volver]').forEach(btn => {
            btn.addEventListener('click', () => volver(btn.dataset.volver));
        });

        if (pila[pila.length - 1] !== ruta) pila.push(ruta);
        window.scrollTo(0, 0);
    } catch (e) {
        console.error(`Error al cargar la ruta "${ruta}":`, e);
        raiz.innerHTML = `
            <div class="page"><div class="page-content">
                <div class="alert alert--error">
                    <span class="material-icons">error_outline</span>
                    <span>No se pudo cargar la pantalla. Recargue la página.</span>
                </div>
            </div></div>`;
    }
}

/** Arranque de la aplicación. */
export function iniciarRouter() {
    window.addEventListener('hashchange', resolver);
    if (!window.location.hash) {
        window.location.hash = SesionActual.existe() ? '#/menu' : '#/login';
    } else {
        resolver();
    }
}
