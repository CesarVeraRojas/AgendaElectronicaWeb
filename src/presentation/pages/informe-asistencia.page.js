/**
 * informe-asistencia.page.js — Resumen de asistencia por grupo y mes (BL-55).
 * Espejo de: InformeAsistenciaScreen.kt + InformeAsistenciaViewModel.kt
 *
 * Sólo el director. Las cuentas las hace el servidor en una sola consulta; aquí
 * no se suma nada, sólo se pinta. Las reglas de cómo se lee un porcentaje viven
 * en domain/entities/InformeAsistencia.js, compartidas con Android.
 */
import { Casos }            from '../../core/container.js';
import { mesAnterior, mesSiguiente, esFuturo } from '../../domain/usecases/ObtenerInformeAsistencia.js';
import { textoPorcentaje, nivelDeAsistencia, textoDelPeriodo,
         csvDelInforme, nombreDeArchivoCsv, BOM_UTF8 } from '../../domain/entities/InformeAsistencia.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, spinner, estadoVacio, bloqueError, campoSelect } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let mesVisible = { anio: 0, mes: 0 };

/** Lo último que se cargó, que es lo que se exporta (BL-56). */
let informeActual = null;

function mesDeHoy() {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
}

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({
                titulo: 'Informe de Asistencia',
                volverA: 'menu',
                acciones: [{ id: 'btn-exportar', icono: 'download', titulo: 'Exportar a CSV' }],
            }))}
            <div class="page-content">
                ${crudo(seccion('', campoSelect({
                    id: 'grupo',
                    etiqueta: 'Grupo',
                    opciones: [],
                    placeholder: 'Cargando…',
                    deshabilitado: true,
                })))}

                <div class="month-nav">
                    <button class="topbar__icon month-nav__btn" id="mes-anterior" aria-label="Mes anterior">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <span class="month-nav__label" id="mes-actual"></span>
                    <button class="topbar__icon month-nav__btn" id="mes-siguiente" aria-label="Mes siguiente">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>

                <div id="informe-totales"></div>
                <div id="informe-alumnos"></div>
            </div>
        </div>`;
}

function pintarTotales(informe) {
    const t = informe.totales;
    return html`
        <section class="card att-summary">
            <div class="att-summary__item">
                <span class="att-summary__num">${t.asistio}</span>
                <span class="att-summary__label">Asistio</span>
            </div>
            <div class="att-summary__item">
                <span class="att-summary__num">${t.tarde}</span>
                <span class="att-summary__label">Tarde</span>
            </div>
            <div class="att-summary__item">
                <span class="att-summary__num">${t.ausente}</span>
                <span class="att-summary__label">Ausente</span>
            </div>
            <div class="att-summary__item">
                <span class="att-summary__num">${textoPorcentaje(t.porcentajeAsistencia)}</span>
                <span class="att-summary__label">Asistencia</span>
            </div>
        </section>
        <p class="report-note">
            ${informe.totalAlumnos} alumno${informe.totalAlumnos === 1 ? '' : 's'}
            · asistencia tomada ${t.diasConRegistro} día${t.diasConRegistro === 1 ? '' : 's'}
            · ${informe.nombreDelAmbito}
        </p>`;
}

function pintarAlumno(alumno) {
    const nivel = nivelDeAsistencia(alumno.porcentajeAsistencia);
    return html`
        <article class="card report-row report-row--${crudo(nivel)}">
            <div class="report-row__head">
                <span class="report-row__name">${alumno.nombreCompleto}</span>
                <span class="badge badge--nivel-${crudo(nivel)}">${textoPorcentaje(alumno.porcentajeAsistencia)}</span>
            </div>
            ${crudo(alumno.sinRegistros
                ? '<p class="report-row__empty">Sin asistencia registrada este mes</p>'
                : html`<p class="report-row__counts">
                        <span>${alumno.asistio} asistio</span>
                        <span>${alumno.tarde} tarde</span>
                        <span>${alumno.ausente} ausente</span>
                       </p>`)}
        </article>`;
}

export async function init() {
    const sesion    = Casos.obtenerSesion.ejecutar();
    const selGrupo  = document.getElementById('grupo');
    const etiqueta  = document.getElementById('mes-actual');
    const anterior  = document.getElementById('mes-anterior');
    const siguiente = document.getElementById('mes-siguiente');
    const totales   = document.getElementById('informe-totales');
    const lista     = document.getElementById('informe-alumnos');
    const exportar  = document.getElementById('btn-exportar');

    exportar.disabled = true;

    mesVisible = mesDeHoy();

    const cargar = async () => {
        etiqueta.textContent = textoDelPeriodo(mesVisible.anio, mesVisible.mes);
        siguiente.disabled = esFuturo(mesSiguiente(mesVisible));

        informeActual = null;
        exportar.disabled = true;
        totales.innerHTML = '';
        lista.innerHTML = spinner('Calculando el informe…');

        try {
            const informe = await Casos.obtenerInformeAsistencia.ejecutar({
                anio: mesVisible.anio,
                mes: mesVisible.mes,
                grupoId: selGrupo.value || null,
            });

            informeActual = informe;
            exportar.disabled = false;
            totales.innerHTML = pintarTotales(informe);

            if (informe.estaVacio) {
                lista.innerHTML = estadoVacio('No hay alumnos en este grupo.', 'group_off');
                return;
            }

            // Los que más faltan, arriba: es a quien el director tiene que mirar.
            lista.innerHTML = informe.porAusencias().map(pintarAlumno).join('');
        } catch (e) {
            totales.innerHTML = '';
            lista.innerHTML = bloqueError(e.message);
        }
    };

    try {
        const grupos = await Casos.obtenerInformeAsistencia.gruposDelColegio(sesion?.colegioId);
        // "Todo el colegio" es una opción de verdad, no un placeholder: el
        // endpoint la soporta sin grupo_id y es la vista más útil al entrar.
        selGrupo.innerHTML = `<option value="">Todo el colegio</option>`
            + grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        // Sin la lista de grupos todavía se puede ver el colegio entero, así que
        // el informe se carga igual en vez de dejar la pantalla en un error.
        avisoError(`No se pudieron cargar los grupos: ${e.message}`);
        selGrupo.innerHTML = `<option value="">Todo el colegio</option>`;
    }

    await cargar();

    exportar.addEventListener('click', () => descargarCsv(informeActual));

    selGrupo.addEventListener('change', cargar);
    anterior.addEventListener('click', () => { mesVisible = mesAnterior(mesVisible); cargar(); });
    siguiente.addEventListener('click', () => {
        const proximo = mesSiguiente(mesVisible);
        if (esFuturo(proximo)) return;
        mesVisible = proximo;
        cargar();
    });
}

/**
 * Descarga el informe como CSV (BL-56).
 *
 * En la web esto es casi gratis: los datos ya están cargados, así que no hay que
 * volver a pedir nada al servidor. El texto lo arma el dominio, compartido con
 * Android; aquí sólo queda envolverlo en un Blob y pinchar un enlace.
 */
function descargarCsv(informe) {
    if (!informe) return;

    try {
        // El BOM va delante del texto: sin él, Excel abre el archivo como
        // Latin-1 y los apellidos con tilde salen rotos.
        const blob = new Blob([BOM_UTF8 + csvDelInforme(informe)], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreDeArchivoCsv(informe);
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        // Si no se libera, el Blob se queda en memoria mientras viva la pestaña,
        // y esta pantalla se exporta una vez por cada mes que se mire.
        URL.revokeObjectURL(url);

        avisoExito('Informe descargado.');
    } catch (e) {
        avisoError(`No se pudo generar el archivo: ${e.message}`);
    }
}
