/**
 * usuarios.page.js — Soporte atiende las cuentas de los jardines (2026-11-20).
 * Sólo web: soporte trabaja desde el computador.
 *
 * Buscar a un director, profesional o acudiente por nombre, correo o documento
 * y ver de qué jardín es y si puede entrar. Desde la tarjeta: restablecer la
 * contraseña (se muestra una sola vez) y desactivar o reactivar la cuenta.
 * Las dos acciones piden confirmación en la propia tarjeta.
 */
import { Casos }       from '../../core/container.js';
import { textoTipo, textoJardines, estadoCuenta, textoSesiones, textoConfirmarDesactivar } from '../../domain/entities/Cuenta.js';
import { html, crudo } from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';
import { fechaHora }   from '../components/formato.js';

let cuentas = [];
let puedeDesactivar = false;

export function render() {
    cuentas = [];
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Usuarios', volverA: 'menu' }))}
            <div class="page-content">
                <form class="buscador-cuentas" id="form-buscar" autocomplete="off">
                    <div class="field buscador-cuentas__campo">
                        <label class="field__label" for="q">Buscar por nombre, correo o documento</label>
                        <input class="field__input" id="q" name="q" type="search" placeholder="Ej.: marta rios" />
                    </div>
                    <button class="btn btn--primary" type="submit" id="btn-buscar">
                        <span class="material-icons">search</span><span class="btn__label">Buscar</span>
                    </button>
                </form>
                <p class="field__ayuda">Directores, profesionales y acudientes de todos los jardines.</p>
                <div id="lista-cuentas"></div>
            </div>
        </div>`;
}

function botonesDeAccion(c, i) {
    return html`
        <div class="acciones-fila cuenta__acciones">
            <button class="btn btn--outlined" data-accion="pedir-restablecer" data-i="${i}">
                <span class="material-icons">key</span><span class="btn__label">Restablecer contraseña</span>
            </button>
            ${crudo(!puedeDesactivar ? '' : c.activo
                ? html`<button class="btn btn--outlined cuenta__desactivar" data-accion="pedir-desactivar" data-i="${i}">
                           <span class="material-icons">block</span><span class="btn__label">Desactivar</span>
                       </button>`
                : html`<button class="btn btn--outlined" data-accion="reactivar" data-i="${i}">
                           <span class="material-icons">check_circle</span><span class="btn__label">Reactivar</span>
                       </button>`)}
        </div>`;
}

function tarjeta(c, i) {
    const estado = estadoCuenta(c);
    const ingreso = c.ultimoIngreso ? `Último ingreso: ${fechaHora(c.ultimoIngreso)}` : 'Sin ingresos registrados';
    const actividad = c.ultimaActividad ? ` · usó la app: ${fechaHora(c.ultimaActividad)}` : '';
    return html`
        <article class="card card--section cuenta" id="cuenta-${i}">
            <h2 class="card__title">${c.nombre} <small class="cuenta__tipo">${textoTipo(c)}</small></h2>
            <div class="card__body">
                <p class="jardin__dato"><span class="material-icons">mail</span>${c.email || 'Sin correo'}</p>
                <p class="jardin__dato"><span class="material-icons">domain</span>${textoJardines(c)}</p>
                <p class="jardin__dato${estado.aviso ? ' jardin__dato--aviso' : ''}"><span class="material-icons">${estado.aviso ? 'warning' : 'verified_user'}</span>${estado.texto}</p>
                <p class="jardin__pie">${ingreso}${actividad} · ${textoSesiones(c)}</p>
                <div data-zona="acciones">${crudo(botonesDeAccion(c, i))}</div>
            </div>
        </article>`;
}

function confirmacion(i, texto, accion, etiqueta, peligro) {
    return html`
        <div class="lightbox__confirmar">
            <p class="lightbox__aviso">${texto}</p>
            <div class="acciones-fila">
                <button class="btn btn--outlined btn--block" data-accion="cancelar" data-i="${i}">Cancelar</button>
                <button class="btn ${peligro ? 'btn--danger' : 'btn--primary'} btn--block" data-accion="${accion}" data-i="${i}">
                    <span class="btn__label">${etiqueta}</span>
                </button>
            </div>
        </div>`;
}

const zona = (i) => document.querySelector(`#cuenta-${i} [data-zona="acciones"]`);

function repintar(i) {
    document.getElementById(`cuenta-${i}`).outerHTML = tarjeta(cuentas[i], i);
}

/** La contraseña temporal, una sola vez, con lo que hay que decirle a la persona. */
function mostrarContrasena(i, r) {
    const c = cuentas[i];
    c.tieneContrasena = true;
    c.sesionesAbiertas = 0;
    repintar(i);
    zona(i).insertAdjacentHTML('beforebegin', html`
        <div class="cuenta__clave">
            <p class="jardin__dato"><span class="material-icons">key</span>Contraseña temporal:</p>
            <p class="cuenta__clave-texto">${r.contrasena}</p>
            <p class="field__ayuda">Entréguesela a ${r.usuario.nombre} para entrar con ${r.usuario.email}. No se volverá a mostrar.
                ${r.sesionesCerradas ? `Se cerraron ${r.sesionesCerradas === 1 ? '1 sesión abierta' : `${r.sesionesCerradas} sesiones abiertas`}.` : ''}
                ${r.activo ? '' : 'La cuenta sigue desactivada: reactívela para que pueda entrar.'}</p>
        </div>`);
}

async function ejecutar(boton, i, accion) {
    const c = cuentas[i];
    boton.disabled = true;
    try {
        if (accion === 'restablecer') {
            mostrarContrasena(i, await Casos.atenderCuentas.restablecerContrasena(c));
        } else if (accion === 'desactivar') {
            const r = await Casos.atenderCuentas.desactivar(c);
            c.activo = r.activo;
            c.sesionesAbiertas = 0;
            repintar(i);
            avisoExito(`Cuenta de ${c.nombre} desactivada.`);
        } else if (accion === 'reactivar') {
            c.activo = (await Casos.atenderCuentas.reactivar(c)).activo;
            repintar(i);
            avisoExito(`Cuenta de ${c.nombre} reactivada.`);
        }
    } catch (e) {
        avisoError(e.message);
        boton.disabled = false;
    }
}

async function buscar(lista) {
    const q = document.getElementById('q').value;
    const btn = document.getElementById('btn-buscar');
    btn.disabled = true;
    lista.innerHTML = spinner('Buscando…');
    try {
        const r = await Casos.atenderCuentas.buscar(q);
        cuentas = r.cuentas;
        puedeDesactivar = r.puedeDesactivar;
        lista.innerHTML = cuentas.length
            ? cuentas.map(tarjeta).join('')
              + (r.hayMas ? '<p class="field__ayuda">Hay más resultados. Escriba algo más preciso para verlos.</p>' : '')
            : estadoVacio('Nadie coincide con esa búsqueda.', 'person_search');
    } catch (e) {
        lista.innerHTML = bloqueError(e.message);
    } finally {
        btn.disabled = false;
    }
}

export function init() {
    const lista = document.getElementById('lista-cuentas');
    document.getElementById('form-buscar').addEventListener('submit', (ev) => {
        ev.preventDefault();
        buscar(lista);
    });
    document.getElementById('q').focus();

    lista.addEventListener('click', (ev) => {
        const boton = ev.target.closest('[data-accion]');
        if (!boton) return;
        const i = Number(boton.dataset.i);
        const c = cuentas[i];
        if (!c) return;
        switch (boton.dataset.accion) {
            case 'pedir-restablecer':
                zona(i).innerHTML = confirmacion(i,
                    `¿Poner una contraseña temporal a ${c.nombre}? La actual deja de servir y se cierran sus sesiones abiertas.`,
                    'restablecer', 'Sí, restablecer', false);
                break;
            case 'pedir-desactivar':
                zona(i).innerHTML = confirmacion(i, `¿Desactivar la cuenta? ${textoConfirmarDesactivar(c)}`,
                    'desactivar', 'Sí, desactivar', true);
                break;
            case 'cancelar':
                zona(i).innerHTML = botonesDeAccion(c, i);
                break;
            default:
                ejecutar(boton, i, boton.dataset.accion);
        }
    });
}
