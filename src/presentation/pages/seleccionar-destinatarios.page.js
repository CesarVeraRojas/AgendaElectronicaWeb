/**
 * seleccionar-destinatarios.page.js — Selección múltiple de destinatarios.
 * Espejo de: SeleccionarDestinatariosScreen.kt
 *
 * En Android es un composable que se muestra sobre la pantalla de redacción;
 * en web es una ruta propia y el borrador viaja por EstadoRuta (el equivalente
 * de savedStateHandle).
 *
 * El director tiene además un atajo por grupos (BL-54): tocar "Jardín" marca
 * las casillas de sus acudientes, no envía nada. Así ve a quién le va a llegar
 * antes de mandarlo, y puede quitar o añadir a alguien.
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { textoMarcadoDeGrupo } from '../../domain/entities/Mensaje.js';
import { html, esc, crudo }    from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError, botonPrimario } from '../components/ui.js';

let borrador = null;
let seleccion = new Map();   // clave "tipo:id" -> UsuarioMensaje
let usuarios  = [];

/**
 * La clave lleva el tipo además del id. Los acudientes, los profesionales y los
 * directores viven en tablas distintas, con su propia numeración, así que dos
 * personas diferentes comparten número a menudo. Con el id a secas, marcar a
 * una seleccionaba a la otra.
 */
const clave = u => `${u.userType}:${u.id}`;

export function render() {
    borrador  = EstadoRuta.borrador ?? null;
    seleccion = new Map((borrador?.destinatarios ?? []).map(d => [clave(d), d]));

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Seleccionar Destinatarios', volverA: 'compose-mensaje' }))}
            <div class="page-content">
                <section id="atajo-grupos" hidden>
                    <p class="pick-groups__title">Escribir a todo un grupo</p>
                    <div class="pick-groups" id="lista-grupos"></div>
                    <p class="pick-groups__status" id="estado-grupo" hidden></p>
                </section>
                <div id="lista-destinatarios"></div>
            </div>
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

/** Deja el aviso del atajo de grupos a la vista, o lo esconde. */
function avisarGrupo(texto, esError = false) {
    const linea = document.getElementById('estado-grupo');
    if (!linea) return;
    linea.textContent = texto;
    linea.hidden = !texto;
    linea.classList.toggle('pick-groups__status--error', Boolean(esError));
}

/** Refleja en las casillas lo que dice `seleccion`. */
function pintarSeleccion() {
    document.querySelectorAll('#lista-destinatarios input[type=checkbox]').forEach(chk => {
        chk.checked = seleccion.has(chk.dataset.clave);
    });
}

/** Marca a los acudientes del grupo, sin quitar nada de lo ya marcado. */
async function marcarGrupo(grupo, boton) {
    const sesion = Casos.obtenerSesion.ejecutar();
    boton.disabled = true;
    avisarGrupo(`Buscando los acudientes de ${grupo.nombreGrupo}…`);

    try {
        const acudientes = await Casos.obtenerAcudientesDeGrupo.ejecutar(sesion, grupo.id);

        const yaEstaban = acudientes.filter(a => seleccion.has(clave(a))).length;
        acudientes.forEach(a => seleccion.set(clave(a), a));
        pintarSeleccion();

        avisarGrupo(textoMarcadoDeGrupo({
            nombreGrupo:        grupo.nombreGrupo,
            nuevos:             acudientes.length - yaEstaban,
            totalGrupo:         acudientes.length,
            totalSeleccionados: seleccion.size,
        }), acudientes.length === 0);
    } catch (e) {
        avisarGrupo(`No se pudieron obtener los acudientes de ${grupo.nombreGrupo}. ${e.message}`, true);
    } finally {
        boton.disabled = false;
    }
}

/** El atajo por grupos, que sólo ve el director. */
async function montarGrupos() {
    const sesion  = Casos.obtenerSesion.ejecutar();
    const seccion = document.getElementById('atajo-grupos');
    if (!seccion || !Casos.obtenerAcudientesDeGrupo.disponiblePara(sesion)) return;

    seccion.hidden = false;
    const contenedor = document.getElementById('lista-grupos');
    contenedor.innerHTML = spinner('Cargando grupos…');

    let grupos = [];
    try {
        grupos = await Casos.obtenerGruposDelUsuario.ejecutar(sesion);
    } catch (e) {
        contenedor.innerHTML = '';
        avisarGrupo(`No se pudieron cargar los grupos. ${e.message}`, true);
        return;
    }

    if (!grupos.length) {
        contenedor.innerHTML = '';
        avisarGrupo('Todavía no hay grupos creados en el colegio.', true);
        return;
    }

    contenedor.innerHTML = grupos.map((g, i) => html`
        <button type="button" class="chip" data-indice="${i}">
            <span class="material-icons">group</span>${g.nombreGrupo}
        </button>`).join('');

    contenedor.querySelectorAll('.chip').forEach(boton => {
        boton.addEventListener('click', () => marcarGrupo(grupos[Number(boton.dataset.indice)], boton));
    });
}

export async function init() {
    const contenedor = document.getElementById('lista-destinatarios');
    contenedor.innerHTML = spinner('Cargando destinatarios…');

    const sesion = Casos.obtenerSesion.ejecutar();
    usuarios = [];

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
        <label class="pick-row" for="dest-${u.userType}-${u.id}">
            <input type="checkbox" id="dest-${u.userType}-${u.id}" data-clave="${clave(u)}"
                   ${crudo(seleccion.has(clave(u)) ? 'checked' : '')} />
            <span class="pick-row__name">${u.displayName}</span>
            <span class="pick-row__type">${u.userType}</span>
        </label>`).join('');

    contenedor.querySelectorAll('input[type=checkbox]').forEach(chk => {
        chk.addEventListener('change', () => {
            const usuario = usuarios.find(u => clave(u) === chk.dataset.clave);
            if (chk.checked) seleccion.set(chk.dataset.clave, usuario);
            else             seleccion.delete(chk.dataset.clave);
        });
    });

    document.getElementById('btn-aceptar').addEventListener('click', () => {
        if (borrador) borrador.destinatarios = [...seleccion.values()];
        navegar('compose-mensaje', { borrador, conservarBorrador: true });
    });

    await montarGrupos();
}
