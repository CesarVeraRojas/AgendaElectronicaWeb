/**
 * router.js — Client-side SPA router
 * Mirrors: NavRoutes.kt + NavigationHost.kt
 *
 * Uses hash-based routing (#/login, #/menu, etc.) so the app
 * works on any static hosting without server-side configuration.
 *
 * Page modules are loaded lazily via dynamic import() — equivalent
 * to how Compose lazy-loads composables in NavHost.
 */

import { Auth } from './auth.js';

// --- Route registry ---
// Each entry maps a route name → dynamic import of the page module.
// Mirrors the composable() entries inside NavHost in NavigationHost.kt.
const routes = {
    'login':                     () => import('./pages/login.js'),
    'menu':                      () => import('./pages/menu.js'),
    'mensajes':                  () => import('./pages/mensajes.js'),
    'mensaje-detail':            () => import('./pages/mensaje-detail.js'),
    'compose-mensaje':           () => import('./pages/compose-mensaje.js'),
    'seleccionar-destinatarios': () => import('./pages/seleccionar-destinatarios.js'),
    'asistencia':                () => import('./pages/asistencia.js'),
    'observaciones':             () => import('./pages/observaciones.js'),
    'agenda-diaria':             () => import('./pages/agenda-diaria.js'),
    'fotos':                     () => import('./pages/fotos.js'),
    'agenda-diaria-hijo':        () => import('./pages/agenda-diaria-hijo.js'),
    'observaciones-hijo':        () => import('./pages/observaciones-hijo.js'),
    'fotos-hijo':                () => import('./pages/fotos-hijo.js'),
    'crear-estudiante':          () => import('./pages/crear-estudiante.js'),
    'crear-grupo':               () => import('./pages/crear-grupo.js'),
    'crear-profesional':         () => import('./pages/crear-profesional.js'),
    'asignar-profesional-grupo': () => import('./pages/asignar-profesional-grupo.js'),
};

// Routes that do NOT require authentication (mirrors the login-only public screen in Android)
const PUBLIC_ROUTES = new Set(['login']);

/**
 * Shared state between pages.
 * Mirrors Android's NavBackStackEntry.savedStateHandle.
 *
 * Usage:
 *   navigate('compose-mensaje', { replyTo: usuario, subject: 'Re: Hola' });
 *   // In compose-mensaje.js:
 *   const { replyTo, subject } = RouterState;
 */
export const RouterState = {};

/**
 * Navigate to a route, optionally passing state.
 * Mirrors: navController.navigate(route) with savedStateHandle data.
 *
 * @param {string} route  - Route name (e.g. 'menu', 'mensajes')
 * @param {Object} [state] - Data to pass to the next page via RouterState
 */
export function navigate(route, state = {}) {
    // Clear previous state, then merge new state
    Object.keys(RouterState).forEach(k => delete RouterState[k]);
    Object.assign(RouterState, state);
    window.location.hash = '#/' + route;
}

/**
 * Go back to the previous page.
 * Mirrors: navController.popBackStack()
 */
export function goBack() {
    history.back();
}

// --- Internal routing logic ---

const app = document.getElementById('app');

function showLoading() {
    app.innerHTML = `
        <div class="loading-screen">
            <div class="spinner"></div>
        </div>`;
}

function showError(message) {
    app.innerHTML = `
        <div class="loading-screen">
            <div class="empty-state">
                <span class="material-icons">error_outline</span>
                <p style="font-size:15px;color:var(--on-surface-variant)">${message}</p>
            </div>
        </div>`;
}

async function handleRoute() {
    // Parse route name from hash: '#/mensaje-detail' → 'mensaje-detail'
    const raw   = window.location.hash.replace(/^#\//, '').trim();
    const route = raw.split('?')[0] || 'login';

    // Auth guard: redirect unauthenticated users to login
    if (!PUBLIC_ROUTES.has(route) && !Auth.isLoggedIn()) {
        navigate('login');
        return;
    }

    // Authenticated users who navigate to login go to menu directly
    if (route === 'login' && Auth.isLoggedIn()) {
        navigate('menu');
        return;
    }

    const loader = routes[route];
    if (!loader) {
        // Unknown route: fall back gracefully
        navigate(Auth.isLoggedIn() ? 'menu' : 'login');
        return;
    }

    showLoading();

    try {
        const module = await loader();
        app.innerHTML = module.render();
        module.init?.();
    } catch (err) {
        console.error(`[Router] Failed to load page "${route}":`, err);
        showError('Error al cargar la página. Por favor recarga.');
    }
}

// Listen to hash changes (equivalent to NavController observing backstack)
window.addEventListener('hashchange', handleRoute);
// Handle initial load
window.addEventListener('DOMContentLoaded', handleRoute);
