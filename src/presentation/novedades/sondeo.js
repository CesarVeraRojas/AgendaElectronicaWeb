/**
 * sondeo.js — Consulta periódica de novedades y avisos del navegador.
 *
 * No hay envío instantáneo: mientras la aplicación está abierta pregunta cada
 * pocos minutos si hay algo nuevo. Es la mitad web de la épica E10; la otra
 * mitad, en Android, consulta también con la aplicación cerrada.
 *
 * Lo que hay que saber:
 *   - Consulta cada cinco minutos. Sin sesión no consulta nada.
 *   - Sigue consultando con la pestaña en segundo plano, que es justo cuando el
 *     aviso del navegador resulta útil; al volver a ella, consulta enseguida.
 *   - En iPhone no existe la interfaz de avisos del navegador, así que allí sólo
 *     queda el contador dentro de la aplicación. Todo lo demás funciona igual.
 */
import { Casos, SesionActual } from '../../core/container.js';
import { navegar }             from '../router/index.js';

const CADA_MS = 5 * 60 * 1000;

let temporizador = null;
let pendientes   = [];
const suscriptores = new Set();

/** ¿Puede este navegador mostrar avisos del sistema? En iPhone, no. */
export function avisosDisponibles() {
    return typeof window !== 'undefined' && 'Notification' in window;
}

export function permisoAvisos() {
    return avisosDisponibles() ? Notification.permission : 'unsupported';
}

/** Los navegadores exigen que lo dispare un gesto del usuario. */
export async function pedirPermisoAvisos() {
    if (!avisosDisponibles()) return 'unsupported';
    try {
        return await Notification.requestPermission();
    } catch {
        return Notification.permission;
    }
}

export function novedadesPendientes() {
    return [...pendientes];
}

/** El usuario ya las vio: se limpia el contador. */
export function marcarVistas() {
    pendientes = [];
    avisar();
}

export function suscribir(callback) {
    suscriptores.add(callback);
    return () => suscriptores.delete(callback);
}

function avisar() {
    suscriptores.forEach(cb => {
        try { cb(novedadesPendientes()); } catch (e) { console.error(e); }
    });
}

/** Aviso del sistema, sólo si el usuario dio permiso. */
function mostrarAvisoDelSistema(novedades) {
    if (permisoAvisos() !== 'granted' || !novedades.length) return;

    // Con muchas de golpe, una sola que resuma: es menos molesto que una cascada.
    const aMostrar = novedades.length > 3
        ? [{ titulo: 'Agenda Electrónica', texto: `Tienes ${novedades.length} novedades`, destino: null }]
        : novedades.map(n => ({ titulo: n.titulo, texto: n.texto, destino: n.rutaDestino() }));

    aMostrar.forEach(({ titulo, texto, destino }) => {
        try {
            const aviso = new Notification(titulo, { body: texto, icon: 'assets/agenda_kids.jpeg', tag: titulo });
            aviso.onclick = () => {
                window.focus();
                navegar(destino ?? 'menu');
                aviso.close();
            };
        } catch (e) {
            console.error('No se pudo mostrar el aviso:', e);
        }
    });
}

async function consultar() {
    if (!SesionActual.existe()) return;
    try {
        const nuevas = await Casos.obtenerNovedades.ejecutar();
        if (!nuevas.length) return;

        pendientes = [...nuevas, ...pendientes];
        mostrarAvisoDelSistema(nuevas);
        avisar();
    } catch (e) {
        // Un fallo de red no debe ensuciar la pantalla: esto corre de fondo.
        console.error('No se pudieron consultar las novedades:', e);
    }
}

/** Arranca la vigilancia. Se llama una sola vez, al cargar la aplicación. */
export function iniciarSondeo() {
    if (temporizador) return;
    consultar();
    temporizador = setInterval(consultar, CADA_MS);

    // Al volver a la pestaña, mirar enseguida en vez de esperar al siguiente turno.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) consultar();
    });
}

/** Al cerrar sesión: lo guardado es de quien se acaba de ir. */
export function olvidarNovedades() {
    pendientes = [];
    Casos.obtenerNovedades.olvidar();
    avisar();
}
