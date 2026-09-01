/**
 * asistencia.page.js — Toma de asistencia por grupo y fecha.
 * Espejo de: AsistenciaScreen.kt + AsistenciaViewModel.kt
 *
 * Todos los estudiantes arrancan en ASISTIO, igual que en Android, y al
 * guardar se envía uno por uno (el backend expone un endpoint por estudiante).
 */
import { Casos }            from '../../core/container.js';
import { ETIQUETAS_ASISTENCIA, EstadoAsistencia } from '../../domain/entities/Asistencia.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, spinner, estadoVacio, bloqueError, campoSelect, campoTexto, botonPrimario } from '../components/ui.js';
import { hoyIso }           from '../components/formato.js';
import { avisoError, avisoExito } from '../components/avisos.js';

/** Estado local de la pantalla: [{estudiante, estado}] */
let listaAsistencia = [];

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Registro de Asistencia', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Seleccionar Fecha y Grupo', `
                    <div class="row-fields">
                        ${campoTexto({ id: 'fecha', etiqueta: 'Fecha', tipo: 'date', valor: hoyIso() })}
                        ${campoSelect({ id: 'grupo', etiqueta: 'Grupo', opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                    </div>`))}

                <div id="lista-estudiantes">
                    ${crudo(estadoVacio('Seleccione un grupo para ver los estudiantes.', 'groups'))}
                </div>

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Asistencia', deshabilitado: true }))}
            </div>
        </div>`;
}

function pintarEstudiantes() {
    const cont = document.getElementById('lista-estudiantes');

    if (!listaAsistencia.length) {
        cont.innerHTML = estadoVacio('Este grupo no tiene estudiantes.', 'group_off');
        document.getElementById('btn-guardar').disabled = true;
        return;
    }

    cont.innerHTML = listaAsistencia.map((item, i) => html`
        <article class="card att-card">
            <p class="att-card__name">${item.estudiante.nombreCompleto}</p>
            <div class="att-card__states">
                ${crudo(ETIQUETAS_ASISTENCIA.map(op => `
                    <label class="choice" for="est-${i}-${esc(op.valor)}">
                        <input type="radio" id="est-${i}-${esc(op.valor)}" name="estado-${i}"
                               value="${esc(op.valor)}" ${item.estado === op.valor ? 'checked' : ''} />
                        <span>${esc(op.etiqueta)}</span>
                    </label>`).join(''))}
            </div>
        </article>`).join('');

    cont.querySelectorAll('input[type=radio]').forEach(radio => {
        radio.addEventListener('change', () => {
            const i = Number(radio.name.split('-')[1]);
            listaAsistencia[i].estado = radio.value;
        });
    });

    document.getElementById('btn-guardar').disabled = false;
}

export async function init() {
    const sesion   = Casos.obtenerSesion.ejecutar();
    const selGrupo = document.getElementById('grupo');
    const btn      = document.getElementById('btn-guardar');

    // Carga de grupos según el rol (profesional → suyos, director → los del colegio)
    try {
        const grupos = await Casos.obtenerGruposDelUsuario.ejecutar(sesion);
        selGrupo.innerHTML = `<option value="">Seleccione un grupo…</option>` +
            grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        selGrupo.innerHTML = `<option value="">Error al cargar grupos</option>`;
        avisoError(e.message);
    }

    selGrupo.addEventListener('change', async () => {
        const cont = document.getElementById('lista-estudiantes');
        if (!selGrupo.value) {
            listaAsistencia = [];
            cont.innerHTML = estadoVacio('Seleccione un grupo para ver los estudiantes.', 'groups');
            btn.disabled = true;
            return;
        }

        cont.innerHTML = spinner('Cargando estudiantes…');
        try {
            const estudiantes = await Casos.obtenerEstudiantesPorGrupo.ejecutar(selGrupo.value);
            // Estado inicial ASISTIO para todos, igual que AsistenciaViewModel
            listaAsistencia = estudiantes.map(e => ({ estudiante: e, estado: EstadoAsistencia.ASISTIO }));
            pintarEstudiantes();
        } catch (e) {
            cont.innerHTML = bloqueError(e.message);
            btn.disabled = true;
        }
    });

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.registrarAsistencia.ejecutar({
                sesion,
                fecha: document.getElementById('fecha').value,
                estudiantes: listaAsistencia,
            });
            avisoExito(msg);
        } catch (e) {
            avisoError(e.message);
        } finally {
            btn.disabled = false;
        }
    });
}
