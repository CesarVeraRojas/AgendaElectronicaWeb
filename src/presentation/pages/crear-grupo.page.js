/**
 * crear-grupo.page.js — Alta de grupo.
 * Espejo de: CrearGrupoScreen.kt + CrearGrupoViewModel.kt
 */
import { Casos }    from '../../core/container.js';
import { html, crudo } from '../components/html.js';
import { topBar, seccion, campoTexto, campoArea, botonPrimario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Crear Nuevo Grupo', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Datos del Grupo', `
                    ${campoTexto({ id: 'nombre',     etiqueta: 'Nombre del Grupo', requerido: true })}
                    ${campoArea({ id: 'descripcion', etiqueta: 'Descripción (Opcional)', filas: 4 })}`))}
                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Grupo' }))}
            </div>
        </div>`;
}

export function init() {
    const btn = document.getElementById('btn-guardar');

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.crearGrupo.ejecutar({
                sesion:      Casos.obtenerSesion.ejecutar(),
                nombreGrupo: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
            });
            avisoExito(msg);
            document.getElementById('nombre').value = '';
            document.getElementById('descripcion').value = '';
        } catch (e) {
            avisoError(e.message);
        } finally {
            btn.disabled = false;
        }
    });
}
