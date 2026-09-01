/**
 * agenda-diaria.page.js — Registro de la agenda diaria del estudiante.
 * Espejo de: AgendaDiariaScreen.kt + AgendaDiariaViewModel.kt
 *
 * Es el formulario más extenso de la aplicación. Las listas de opciones NO se
 * escriben aquí: vienen de domain/entities/AgendaDiaria.js, para que web y
 * Android guarden exactamente los mismos textos en la base de datos.
 */
import { Casos }            from '../../core/container.js';
import {
    OPCIONES_ALIMENTACION, OPCIONES_SI_NO, OPCIONES_ESTADO_ANIMO,
    OPCIONES_COMPETENCIAS, OPCIONES_EN_LA_CLASE, OPCIONES_ROL_SOCIAL,
} from '../../domain/entities/AgendaDiaria.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, campoSelect, campoTexto, campoArea, botonPrimario, grupoRadios, grupoCheckboxes } from '../components/ui.js';
import { hoyIso }           from '../components/formato.js';
import { avisoError, avisoExito } from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Agenda Diaria', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Seleccionar Grupo y Estudiante', `
                    <div class="row-fields">
                        ${campoSelect({ id: 'grupo',      etiqueta: 'Grupo',      opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                        ${campoSelect({ id: 'estudiante', etiqueta: 'Estudiante', opciones: [], placeholder: 'Seleccione un grupo primero', deshabilitado: true })}
                    </div>
                    ${campoTexto({ id: 'fecha', etiqueta: 'Fecha del día', tipo: 'date', valor: hoyIso() })}`))}

                ${crudo(seccion('ALIMENTACIÓN', `
                    ${grupoRadios({ nombre: 'snack_am',  opciones: OPCIONES_ALIMENTACION, subtitulo: 'Snack AM' })}
                    ${grupoRadios({ nombre: 'almuerzo',  opciones: OPCIONES_ALIMENTACION, subtitulo: 'Almuerzo' })}
                    ${grupoRadios({ nombre: 'snack_pm',  opciones: OPCIONES_ALIMENTACION, subtitulo: 'Snack PM' })}`))}

                ${crudo(seccion('CONTROL DE ESFÍNTERES', `
                    ${grupoRadios({ nombre: 'miccion',      opciones: OPCIONES_SI_NO, subtitulo: 'Micción' })}
                    ${grupoRadios({ nombre: 'deposicion',   opciones: OPCIONES_SI_NO, subtitulo: 'Deposición' })}
                    ${grupoRadios({ nombre: 'cambio_panal', opciones: OPCIONES_SI_NO, subtitulo: 'Cambio de Pañal' })}`))}

                ${crudo(seccion('ESTADO DE ÁNIMO',
                    grupoCheckboxes({ nombre: 'animo', opciones: OPCIONES_ESTADO_ANIMO })))}

                ${crudo(seccion('DESARROLLO DE COMPETENCIAS',
                    grupoRadios({ nombre: 'competencias', opciones: OPCIONES_COMPETENCIAS })))}

                ${crudo(seccion('EN LA CLASE',
                    grupoRadios({ nombre: 'en_clase', opciones: OPCIONES_EN_LA_CLASE })))}

                ${crudo(seccion('ROL SOCIAL',
                    grupoRadios({ nombre: 'rol_social', opciones: OPCIONES_ROL_SOCIAL })))}

                ${crudo(seccion('COMENTARIOS DEL DÍA',
                    campoArea({ id: 'comentarios', etiqueta: 'Detalle', filas: 5 })))}

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Agenda Diaria', deshabilitado: true }))}
            </div>
        </div>`;
}

/** Lee el radio marcado de un grupo; null si ninguno. */
const radioMarcado = (nombre) =>
    document.querySelector(`input[name="${nombre}"]:checked`)?.value ?? null;

/** Lee todas las casillas marcadas de un grupo. */
const casillasMarcadas = (nombre) =>
    [...document.querySelectorAll(`input[name="${nombre}"]:checked`)].map(c => c.value);

export async function init() {
    const sesion        = Casos.obtenerSesion.ejecutar();
    const selGrupo      = document.getElementById('grupo');
    const selEstudiante = document.getElementById('estudiante');
    const btn           = document.getElementById('btn-guardar');

    const refrescarBoton = () => { btn.disabled = !selEstudiante.value; };

    try {
        const grupos = await Casos.obtenerGruposDelUsuario.ejecutar(sesion);
        selGrupo.innerHTML = `<option value="">Seleccione un grupo…</option>` +
            grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        avisoError(e.message);
    }

    selGrupo.addEventListener('change', async () => {
        selEstudiante.innerHTML = `<option value="">Cargando…</option>`;
        selEstudiante.disabled = true;
        refrescarBoton();

        if (!selGrupo.value) {
            selEstudiante.innerHTML = `<option value="">Seleccione un grupo primero</option>`;
            return;
        }

        try {
            const estudiantes = await Casos.obtenerEstudiantesPorGrupo.ejecutar(selGrupo.value);
            selEstudiante.innerHTML = estudiantes.length
                ? `<option value="">Seleccione un estudiante…</option>` +
                  estudiantes.map(e => `<option value="${esc(e.id)}">${esc(e.nombreCompleto)}</option>`).join('')
                : `<option value="">No hay estudiantes en este grupo</option>`;
            selEstudiante.disabled = !estudiantes.length;
        } catch (e) {
            selEstudiante.innerHTML = `<option value="">Error al cargar</option>`;
            avisoError(e.message);
        }
    });

    selEstudiante.addEventListener('change', refrescarBoton);

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.guardarAgendaDiaria.ejecutar({
                sesion,
                estudianteId: selEstudiante.value,
                fecha:        document.getElementById('fecha').value,
                campos: {
                    alimentacionSnackAM:          radioMarcado('snack_am'),
                    alimentacionAlmuerzo:         radioMarcado('almuerzo'),
                    alimentacionSnackPM:          radioMarcado('snack_pm'),
                    controlEsfinteresMiccion:     radioMarcado('miccion'),
                    controlEsfinteresDeposicion:  radioMarcado('deposicion'),
                    controlEsfinteresCambioPanal: radioMarcado('cambio_panal'),
                    estadoAnimo:                  casillasMarcadas('animo'),
                    desarrolloCompetencias:       radioMarcado('competencias'),
                    enLaClase:                    radioMarcado('en_clase'),
                    rolSocial:                    radioMarcado('rol_social'),
                    comentariosDelDia:            document.getElementById('comentarios').value,
                },
            });
            avisoExito(msg);
        } catch (e) {
            avisoError(e.message);
        } finally {
            refrescarBoton();
        }
    });
}
