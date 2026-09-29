/**
 * fotos-colegio.page.js — Todas las fotos del colegio, para el director (BL-61).
 * Espejo de: FotosColegioScreen.kt + FotosColegioViewModel.kt
 *
 * Las fotos llegan del servidor ya ordenadas (la más reciente primero),
 * filtradas y por páginas de 30; aquí sólo se agrupan por día y se pintan. Las
 * reglas de lectura viven en domain/entities/FotoDelColegio.js, compartidas con
 * Android.
 *
 * Borrar es sólo del director, y quien lo decide es el servidor: esta pantalla
 * sólo aparece en su menú, pero eliminar_foto.php responde 403 a cualquier otro.
 */
import { Casos }            from '../../core/container.js';
import { agruparPorDia, juntarPaginas, sinFoto, textoDelDia, textoSubidoPor,
         textoSinFotos, TEXTO_CONFIRMAR_ELIMINAR } from '../../domain/entities/FotoDelColegio.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, spinner, estadoVacio, bloqueError, campoSelect, botonSecundario } from '../components/ui.js';
import { fechaLarga }       from '../components/formato.js';
import { avisoError, avisoExito } from '../components/avisos.js';

/** Lo cargado hasta ahora. Se reinicia al cambiar un filtro. */
let estado = { fotos: [], hoy: null, hayMas: false, siguiente: null };

/**
 * Cada carga lleva un número. Si el director cambia de filtro antes de que
 * llegue la respuesta anterior, esa respuesta vieja se descarta en vez de
 * pintar las fotos de un grupo bajo el filtro de otro.
 */
let turno = 0;

export function render() {
    estado = { fotos: [], hoy: null, hayMas: false, siguiente: null };
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Fotos del Colegio', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('', `
                    ${campoSelect({ id: 'grupo',      etiqueta: 'Grupo',      opciones: [], placeholder: 'Cargando…', deshabilitado: true })}
                    ${campoSelect({ id: 'estudiante', etiqueta: 'Estudiante', opciones: [], placeholder: 'Cargando…', deshabilitado: true })}`))}
                <div id="galeria"></div>
                <div id="mas" class="gallery-more"></div>
            </div>
        </div>`;
}

function tarjeta(foto) {
    return html`
        <figure class="photo" data-id="${foto.id}">
            <img class="photo__img" src="${foto.fotoUrl}" alt="Foto de ${foto.estudianteNombre}" loading="lazy" />
            <figcaption class="photo__caption">
                <span class="photo__name">${foto.estudianteNombre}</span>
                <span>${foto.hora}</span>
            </figcaption>
        </figure>`;
}

function pintarGaleria(cont, filtro) {
    if (!estado.fotos.length) {
        cont.innerHTML = estadoVacio(textoSinFotos(filtro), 'photo_library');
        return;
    }

    cont.innerHTML = agruparPorDia(estado.fotos).map(grupo => html`
        <section class="gallery-group">
            <h2 class="gallery-group__title">${textoDelDia(grupo.dia, estado.hoy)}</h2>
            <div class="gallery-grid">${crudo(grupo.fotos.map(tarjeta).join(''))}</div>
        </section>`).join('');
}

function pintarBotonMas(cont) {
    cont.innerHTML = estado.hayMas
        ? botonSecundario({ id: 'btn-mas', texto: 'Cargar más fotos', icono: 'expand_more', ancho: true })
        : '';
}

export async function init() {
    const sesion        = Casos.obtenerSesion.ejecutar();
    const selGrupo      = document.getElementById('grupo');
    const selEstudiante = document.getElementById('estudiante');
    const galeria       = document.getElementById('galeria');
    const mas           = document.getElementById('mas');

    const filtroActual = () => ({
        grupoId:      selGrupo.value ? Number(selGrupo.value) : null,
        estudianteId: selEstudiante.value ? Number(selEstudiante.value) : null,
    });

    /** Primera página si `continuar` es false; la siguiente si es true. */
    const cargar = async (continuar = false) => {
        const miTurno = ++turno;
        const filtro  = filtroActual();

        if (continuar) {
            mas.innerHTML = spinner('Cargando más fotos…');
        } else {
            estado = { fotos: [], hoy: null, hayMas: false, siguiente: null };
            galeria.innerHTML = spinner('Cargando fotos…');
            mas.innerHTML = '';
        }

        try {
            const pagina = await Casos.obtenerFotosDelColegio.ejecutar({
                ...filtro,
                antesDe: continuar ? estado.siguiente : null,
            });
            if (miTurno !== turno) return;

            estado = {
                fotos:     juntarPaginas(continuar ? estado.fotos : [], pagina.fotos),
                hoy:       pagina.hoy,
                hayMas:    pagina.hayMas,
                siguiente: pagina.siguiente,
            };
            pintarGaleria(galeria, filtro);
            pintarBotonMas(mas);
        } catch (e) {
            if (miTurno !== turno) return;
            if (continuar) {
                avisoError(e.message);
                pintarBotonMas(mas);
            } else {
                galeria.innerHTML = bloqueError(e.message);
            }
        }
    };

    const llenarEstudiantes = async () => {
        selEstudiante.disabled = true;
        selEstudiante.innerHTML = `<option value="">Cargando…</option>`;
        try {
            const lista = await Casos.obtenerFotosDelColegio.estudiantes(selGrupo.value || null);
            selEstudiante.innerHTML = `<option value="">Todos los estudiantes</option>`
                + lista.map(e => `<option value="${esc(e.id)}">${esc(e.nombreCompleto)}</option>`).join('');
            selEstudiante.disabled = false;
        } catch (e) {
            // Sin la lista todavía se pueden ver las fotos del grupo entero.
            selEstudiante.innerHTML = `<option value="">Todos los estudiantes</option>`;
            avisoError(`No se pudieron cargar los estudiantes: ${e.message}`);
        }
    };

    try {
        const grupos = await Casos.obtenerFotosDelColegio.gruposDelColegio(sesion?.colegioId);
        selGrupo.innerHTML = `<option value="">Todos los grupos</option>`
            + grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        avisoError(`No se pudieron cargar los grupos: ${e.message}`);
        selGrupo.innerHTML = `<option value="">Todos los grupos</option>`;
    }

    await Promise.all([llenarEstudiantes(), cargar()]);

    // Al cambiar de grupo el estudiante elegido puede no pertenecer al nuevo,
    // así que se vuelve a "todos" antes de pedir las fotos.
    selGrupo.addEventListener('change', async () => {
        selEstudiante.value = '';
        cargar();
        await llenarEstudiantes();
    });
    selEstudiante.addEventListener('change', () => cargar());

    mas.addEventListener('click', (e) => {
        if (e.target.closest('#btn-mas')) cargar(true);
    });

    galeria.addEventListener('click', (e) => {
        const fig = e.target.closest('.photo');
        if (!fig) return;
        const foto = estado.fotos.find(f => f.id === Number(fig.dataset.id));
        if (foto) abrirDetalle(foto, async () => {
            await Casos.eliminarFoto.ejecutar(foto.id);
            estado.fotos = sinFoto(estado.fotos, foto.id);
            pintarGaleria(galeria, filtroActual());
            avisoExito('Foto eliminada.');
            // Si se borró la última visible y hay más en el servidor, se trae la
            // siguiente página en vez de enseñar un "no hay fotos" que miente.
            if (!estado.fotos.length && estado.hayMas) cargar(true);
        });
    });
}

/**
 * La foto en grande, con sus datos y el botón de eliminar.
 *
 * Eliminar pide confirmación en el mismo visor, no con `confirm()`: ahí se
 * puede decir qué pasa (las familias dejan de verla) y que no hay vuelta atrás.
 */
function abrirDetalle(foto, alEliminar) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox lightbox--detalle';
    overlay.innerHTML = html`
        <div class="lightbox__toolbar">
            <a class="lightbox__btn" href="${foto.fotoUrl}" download target="_blank" rel="noopener" title="Descargar">
                <span class="material-icons">download</span>
            </a>
            <button class="lightbox__btn" data-cerrar title="Cerrar" aria-label="Cerrar">
                <span class="material-icons">close</span>
            </button>
        </div>
        <img class="lightbox__img" src="${foto.fotoUrl}" alt="Foto de ${foto.estudianteNombre}" />
        <div class="lightbox__panel">
            <p class="lightbox__title">${foto.estudianteNombre}</p>
            ${crudo(foto.grupos.length ? html`<p class="lightbox__meta">${foto.grupos.join(', ')}</p>` : '')}
            <p class="lightbox__meta">${fechaLarga(foto.dia)} · ${foto.hora}</p>
            <p class="lightbox__meta">${textoSubidoPor(foto.subidoPor)}</p>
            <div class="lightbox__acciones" data-paso="inicio">
                <button class="btn btn--danger btn--block" data-eliminar>
                    <span class="material-icons">delete</span><span class="btn__label">Eliminar foto</span>
                </button>
            </div>
            <div class="lightbox__confirmar" data-paso="confirmar" hidden>
                <p class="lightbox__aviso">¿Eliminar esta foto? ${TEXTO_CONFIRMAR_ELIMINAR}</p>
                <div class="acciones-fila">
                    <button class="btn btn--outlined btn--block" data-cancelar>Cancelar</button>
                    <button class="btn btn--danger btn--block" data-confirmar>
                        <span class="btn__label">Sí, eliminar</span>
                    </button>
                </div>
            </div>
        </div>`;

    const inicio    = overlay.querySelector('[data-paso="inicio"]');
    const confirmar = overlay.querySelector('[data-paso="confirmar"]');
    const btnSi     = overlay.querySelector('[data-confirmar]');

    const cerrar = () => {
        overlay.remove();
        document.removeEventListener('keydown', alPulsarTecla);
    };
    const alPulsarTecla = (e) => { if (e.key === 'Escape') cerrar(); };

    overlay.addEventListener('click', async (e) => {
        if (e.target === overlay || e.target.closest('[data-cerrar]')) return cerrar();

        if (e.target.closest('[data-eliminar]')) {
            inicio.hidden = true;
            confirmar.hidden = false;
            return;
        }
        if (e.target.closest('[data-cancelar]')) {
            confirmar.hidden = true;
            inicio.hidden = false;
            return;
        }
        if (e.target.closest('[data-confirmar]')) {
            btnSi.disabled = true;
            btnSi.querySelector('.btn__label').textContent = 'Eliminando…';
            try {
                await alEliminar();
                cerrar();
            } catch (err) {
                avisoError(err.message);
                btnSi.disabled = false;
                btnSi.querySelector('.btn__label').textContent = 'Sí, eliminar';
            }
        }
    });
    document.addEventListener('keydown', alPulsarTecla);
    document.body.appendChild(overlay);
}
