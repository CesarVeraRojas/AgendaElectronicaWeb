/**
 * publicar-circular.page.js — El director publica una circular (BL-70).
 * Espejo de: PublicarCircularScreen.kt
 *
 * Título, a quién va (todo el colegio o un grupo), texto y un PDF o imagen
 * opcional. Tiene que llevar texto o adjunto. Sólo el director llega aquí, y
 * aun así quien decide es el servidor (publicar_circular.php).
 */
import { Casos }            from '../../core/container.js';
import { navegar }          from '../router/index.js';
import { NuevaCircular, MAX_TITULO, TIPOS_DE_ADJUNTO, textoDestino } from '../../domain/entities/Circular.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, campoTexto, campoArea, campoSelect, botonPrimario, botonSecundario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let adjunto = null;

export function render() {
    adjunto = null;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Nueva circular', volverA: 'circulares' }))}
            <div class="page-content">
                ${crudo(campoTexto({ id: 'titulo', etiqueta: 'Título', requerido: true,
                                     placeholder: 'Ej.: Reunión de padres del viernes' }))}
                ${crudo(campoSelect({ id: 'destino', etiqueta: 'Para', opciones: [],
                                      placeholder: 'Cargando grupos…', deshabilitado: true }))}
                ${crudo(campoArea({ id: 'texto', etiqueta: 'Texto', filas: 8,
                                    placeholder: 'Escriba aquí la circular. Si sólo adjunta un documento, puede dejarlo vacío.' }))}

                <input type="file" id="input-adjunto" accept="${TIPOS_DE_ADJUNTO}" hidden />
                <div id="adjunto-info" class="attachment" hidden>
                    <span class="material-icons">attach_file</span>
                    <span class="attachment__name" id="adjunto-nombre"></span>
                    <button class="attachment__remove" id="btn-quitar-adjunto" title="Quitar adjunto" type="button">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <p class="field__ayuda">Puede adjuntar un PDF o una imagen de hasta 10 MB.</p>

                <div class="row-actions">
                    ${crudo(botonSecundario({ id: 'btn-adjuntar', texto: 'Adjuntar', icono: 'attach_file' }))}
                    ${crudo(botonPrimario({ id: 'btn-publicar', texto: 'Publicar', icono: 'campaign', ancho: false }))}
                </div>
            </div>
        </div>`;
}

export async function init() {
    const sesion      = Casos.obtenerSesion.ejecutar();
    const selDestino  = document.getElementById('destino');
    const input       = document.getElementById('input-adjunto');
    const info        = document.getElementById('adjunto-info');
    const nombre      = document.getElementById('adjunto-nombre');
    const btnPublicar = document.getElementById('btn-publicar');

    document.getElementById('titulo').maxLength = MAX_TITULO;

    // Sin la lista de grupos todavía se puede publicar a todo el colegio.
    const opcionColegio = `<option value="">${esc(textoDestino(null))}</option>`;
    try {
        const grupos = await Casos.obtenerCirculares.gruposDelColegio(sesion?.colegioId);
        selDestino.innerHTML = opcionColegio
            + grupos.map(g => `<option value="${esc(g.id)}">${esc(textoDestino(g.nombreGrupo))}</option>`).join('');
    } catch (e) {
        selDestino.innerHTML = opcionColegio;
        avisoError(`No se pudieron cargar los grupos: ${e.message}`);
    }
    selDestino.disabled = false;

    document.getElementById('btn-adjuntar').addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        adjunto = input.files?.[0] ?? null;
        nombre.textContent = adjunto?.name ?? '';
        info.hidden = !adjunto;
    });
    document.getElementById('btn-quitar-adjunto').addEventListener('click', () => {
        adjunto = null;
        input.value = '';
        info.hidden = true;
    });

    btnPublicar.addEventListener('click', async () => {
        const nueva = new NuevaCircular({
            titulo:  document.getElementById('titulo').value,
            texto:   document.getElementById('texto').value,
            grupoId: selDestino.value ? Number(selDestino.value) : null,
            adjunto,
        });

        btnPublicar.disabled = true;
        btnPublicar.querySelector('.btn__label').textContent = 'Publicando…';
        try {
            await Casos.publicarCircular.ejecutar(nueva);
            avisoExito('Circular publicada.');
            navegar('circulares');
        } catch (e) {
            avisoError(e.message);
            btnPublicar.disabled = false;
            btnPublicar.querySelector('.btn__label').textContent = 'Publicar';
        }
    });
}
