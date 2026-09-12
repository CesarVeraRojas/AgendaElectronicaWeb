/**
 * seleccionar-destinatarios.page.js — Selección múltiple de destinatarios.
 * Espejo de: SeleccionarDestinatariosScreen.kt
 *
 * En Android es un composable que se muestra sobre la pantalla de redacción;
 * en web es una ruta propia y el borrador viaja por EstadoRuta (el equivalente
 * de savedStateHandle).
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { html, esc, crudo }    from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError, botonPrimario } from '../components/ui.js';

let borrador = null;
let seleccion = new Map();   // id -> UsuarioMensaje

export function render() {
    borrador  = EstadoRuta.borrador ?? null;
    seleccion = new Map((borrador?.destinatarios ?? []).map(d => [String(d.id), d]));

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Seleccionar Destinatarios', volverA: 'compose-mensaje' }))}
            <div class="page-content" id="lista-destinatarios"></div>
            <div class="page-footer">
                ${crudo(botonPrimario({ id: 'btn-aceptar', texto: 'Aceptar' }))}
            </div>
        </div>`;
}

/**
 * Lo que la flecha atrás se lleva de vuelta a la redacción: el borrador tal y
 * como llegó, para no perder el asunto ni el cuerpo. Los destinatarios marcados
 * se descartan a propósito, porque sólo se aplican con Aceptar.
 */
export function estadoAlVolver() {
    return borrador ? { borrador, conservarBorrador: true } : {};
}

export async function init() {
    const contenedor = document.getElementById('lista-destinatarios');
    contenedor.innerHTML = spinner('Cargando destinatarios…');

    const sesion = Casos.obtenerSesion.ejecutar();
    let usuarios = [];

    try {
        usuarios = await Casos.obtenerDestinatarios.ejecutar(sesion);
    } catch (e) {
        contenedor.innerHTML = bloqueError(e.message);
        return;
    }

    if (!usuarios.length) {
        contenedor.innerHTML = estadoVacio('No hay destinatarios disponibles.', 'group_off');
        return;
    }

    contenedor.innerHTML = usuarios.map(u => html`
        <label class="pick-row" for="dest-${u.id}">
            <input type="checkbox" id="dest-${u.id}" value="${u.id}"
                   ${crudo(seleccion.has(String(u.id)) ? 'checked' : '')} />
            <span class="pick-row__name">${u.displayName}</span>
            <span class="pick-row__type">${u.userType}</span>
        </label>`).join('');

    contenedor.querySelectorAll('input[type=checkbox]').forEach(chk => {
        chk.addEventListener('change', () => {
            const usuario = usuarios.find(u => String(u.id) === chk.value);
            if (chk.checked) seleccion.set(chk.value, usuario);
            else             seleccion.delete(chk.value);
        });
    });

    document.getElementById('btn-aceptar').addEventListener('click', () => {
        if (borrador) borrador.destinatarios = [...seleccion.values()];
        navegar('compose-mensaje', { borrador, conservarBorrador: true });
    });
}
