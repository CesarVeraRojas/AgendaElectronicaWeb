/**
 * editar-evento.page.js — Crear o editar un evento (BL-76).
 * Espejo de: EditarEventoScreen.kt
 *
 * Los tipos salen del jardín (tipos_eventos.ini) y los grupos, de los que este
 * usuario puede usar: el director, "Todo el jardín" y todos los grupos; un
 * profesional, sólo los suyos (y ninguna opción de "Todo el jardín").
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { Rol }                 from '../../domain/entities/Sesion.js';
import { NuevoEvento, MAX_TITULO_EVENTO } from '../../domain/entities/Evento.js';
import { html, crudo }         from '../components/html.js';
import { topBar, campoTexto, campoArea, spinner, bloqueError, botonPrimario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let evento = null;       // el que se edita, o null si es nuevo
let calendario = null;

export function render() {
    evento = EstadoRuta.evento ?? null;
    calendario = EstadoRuta.calendario ?? null;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: evento ? 'Editar evento' : 'Nuevo evento', volverA: evento ? 'eventos' : 'eventos' }))}
            <div class="page-content" id="form-evento">${crudo(spinner('Preparando…'))}</div>
        </div>`;
}

const opcion = (valor, texto, elegido) =>
    html`<option value="${valor}"${crudo(String(valor) === String(elegido) ? ' selected' : '')}>${texto}</option>`;

function pintarFormulario(cont, esDirector) {
    const e = evento;
    const varios = !!(e && e.fechaFin !== e.fechaInicio);
    const todoElDia = e ? !e.horaInicio : false;
    const grupos = calendario.gruposParaCrear;
    cont.innerHTML = html`
        <div class="field">
            <label class="field__label" for="ev-tipo">Tipo *</label>
            <select class="field__input field__select" id="ev-tipo">
                ${crudo(opcion('', 'Elija el tipo…', e?.tipo ?? ''))}
                ${crudo(calendario.tipos.map(t => opcion(t.clave, t.nombre, e?.tipo)).join(''))}
            </select>
        </div>
        ${crudo(campoTexto({ id: 'ev-titulo', etiqueta: 'Título', requerido: true, valor: e?.titulo ?? '', placeholder: 'Ej.: Reunión de padres' }))}
        <div class="field">
            <label class="field__label" for="ev-para">Para *</label>
            <select class="field__input field__select" id="ev-para">
                ${crudo(esDirector ? opcion('', 'Todo el jardín', e?.grupoId ?? '') : '')}
                ${crudo(grupos.map(g => opcion(g.id, `Grupo ${g.nombre}`, e?.grupoId)).join(''))}
            </select>
        </div>
        ${crudo(campoTexto({ id: 'ev-inicio', etiqueta: 'Fecha', tipo: 'date', requerido: true, valor: e?.fechaInicio ?? calendario.hoy }))}
        <label class="choice"><input type="checkbox" id="ev-varios" ${crudo(varios ? 'checked' : '')} /><span>Dura varios días</span></label>
        <div id="bloque-fin" ${crudo(varios ? '' : 'hidden')}>
            ${crudo(campoTexto({ id: 'ev-fin', etiqueta: 'Hasta', tipo: 'date', valor: varios ? e.fechaFin : '' }))}
        </div>
        <label class="choice"><input type="checkbox" id="ev-todo-dia" ${crudo(todoElDia ? 'checked' : '')} /><span>Todo el día</span></label>
        <div id="bloque-horas" class="evento-horas" ${crudo(todoElDia ? 'hidden' : '')}>
            ${crudo(campoTexto({ id: 'ev-hora-inicio', etiqueta: 'Desde', tipo: 'time', valor: e?.horaInicio ?? '' }))}
            ${crudo(campoTexto({ id: 'ev-hora-fin', etiqueta: 'Hasta (opcional)', tipo: 'time', valor: e?.horaFin ?? '' }))}
        </div>
        ${crudo(campoTexto({ id: 'ev-lugar', etiqueta: 'Lugar', valor: e?.lugar ?? '', placeholder: 'Ej.: Salón principal' }))}
        ${crudo(campoArea({ id: 'ev-descripcion', etiqueta: 'Descripción', filas: 5, valor: e?.descripcion ?? '',
                            placeholder: 'Lo que las familias deben saber o traer.' }))}
        ${crudo(botonPrimario({ id: 'btn-guardar-evento', texto: e ? 'Guardar cambios' : 'Crear evento', icono: 'event' }))}`;

    document.getElementById('ev-titulo').maxLength = MAX_TITULO_EVENTO;
    document.getElementById('ev-inicio').min = calendario.hoy;
    const varios_ = document.getElementById('ev-varios');
    const todo = document.getElementById('ev-todo-dia');
    varios_.addEventListener('change', () => { document.getElementById('bloque-fin').hidden = !varios_.checked; });
    todo.addEventListener('change', () => { document.getElementById('bloque-horas').hidden = todo.checked; });
}

export async function init() {
    const cont = document.getElementById('form-evento');
    const sesion = Casos.obtenerSesion.ejecutar();
    const esDirector = sesion?.userType === Rol.DIRECTOR;

    try {
        // Si se recargó la página no hay calendario en memoria: se pide.
        if (!calendario) calendario = await Casos.administrarEventos.listar();
    } catch (e) {
        cont.innerHTML = bloqueError(e.message);
        return;
    }
    if (!calendario.puedeCrear) {
        cont.innerHTML = bloqueError('No tiene grupos en los que crear eventos.');
        return;
    }
    pintarFormulario(cont, esDirector);

    const btn = document.getElementById('btn-guardar-evento');
    btn.addEventListener('click', async () => {
        const v = (id) => document.getElementById(id).value;
        const todoElDia = document.getElementById('ev-todo-dia').checked;
        const varios = document.getElementById('ev-varios').checked;
        const nuevo = new NuevoEvento({
            eventoId: evento?.id ?? null, tipo: v('ev-tipo'), titulo: v('ev-titulo'), descripcion: v('ev-descripcion'),
            lugar: v('ev-lugar'), fechaInicio: v('ev-inicio'), fechaFin: varios ? v('ev-fin') : '',
            horaInicio: todoElDia ? '' : v('ev-hora-inicio'), horaFin: todoElDia ? '' : v('ev-hora-fin'),
            grupoId: v('ev-para') ? Number(v('ev-para')) : null,
        });
        btn.disabled = true;
        btn.querySelector('.btn__label').textContent = 'Guardando…';
        try {
            await Casos.administrarEventos.guardar(nuevo, { hoy: calendario.hoy, esProfesional: !esDirector });
            avisoExito(evento ? 'Evento actualizado.' : 'Evento creado.');
            navegar('eventos');
        } catch (e) {
            avisoError(e.message);
            btn.disabled = false;
            btn.querySelector('.btn__label').textContent = evento ? 'Guardar cambios' : 'Crear evento';
        }
    });
}
