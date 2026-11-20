/**
 * editar-jardin.page.js — Soporte corrige los datos de un jardín y de sus
 * directores (2026-11-20). Llega desde la tarjeta del jardín con el jardín en
 * EstadoRuta.jardin; si se recarga la página sin él, vuelve a la lista.
 *
 * El documento y la contraseña del director no se cambian aquí: la contraseña
 * se restablece desde "Usuarios".
 */
import { Casos }               from '../../core/container.js';
import { navegar, EstadoRuta } from '../router/index.js';
import { JardinEditado }       from '../../domain/entities/Jardin.js';
import { html, crudo }         from '../components/html.js';
import { topBar, seccion, campoTexto, botonPrimario, estadoVacio } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

let editado = null;

export function render() {
    editado = EstadoRuta.jardin ? JardinEditado.desde(EstadoRuta.jardin) : null;
    if (!editado) {
        return html`
            <div class="page">
                ${crudo(topBar({ titulo: 'Editar jardín', volverA: 'jardines' }))}
                <div class="page-content">${crudo(estadoVacio('Elija el jardín desde la lista de jardines.', 'domain'))}</div>
            </div>`;
    }
    const directores = editado.directores.map((d, i) => seccion(
        editado.directores.length > 1 ? `Director(a) ${i + 1}` : 'Su director o directora', [
            campoTexto({ id: `d${i}-nombres`, etiqueta: 'Nombres', requerido: true, valor: d.nombres }),
            campoTexto({ id: `d${i}-apellidos`, etiqueta: 'Apellidos', requerido: true, valor: d.apellidos }),
            campoTexto({ id: `d${i}-email`, etiqueta: 'Correo (con este entra a AgendaKids)', tipo: 'email', requerido: true, valor: d.email }),
            campoTexto({ id: `d${i}-telefono`, etiqueta: 'Teléfono', tipo: 'tel', valor: d.telefono }),
            '<p class="field__ayuda">Si cambia el correo, avísele: desde ya entra con el nuevo.</p>',
        ].join(''))).join('');

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Editar jardín', volverA: 'jardines' }))}
            <div class="page-content">
                ${crudo(seccion('El jardín', [
                    campoTexto({ id: 'j-nombre', etiqueta: 'Nombre del jardín', requerido: true, valor: editado.nombre }),
                    campoTexto({ id: 'j-direccion', etiqueta: 'Dirección', valor: editado.direccion }),
                    campoTexto({ id: 'j-correo', etiqueta: 'Correo del jardín', tipo: 'email', valor: editado.correo }),
                    `<p class="field__ayuda">Número del jardín: ${editado.id}</p>`,
                ].join('')))}
                ${crudo(directores)}
                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar cambios', icono: 'save' }))}
            </div>
        </div>`;
}

const valor = (id) => document.getElementById(id).value;

export function init() {
    if (!editado) return;
    const btn = document.getElementById('btn-guardar');
    btn.addEventListener('click', async () => {
        const cambios = new JardinEditado({
            id: editado.id, nombre: valor('j-nombre'), direccion: valor('j-direccion'), correo: valor('j-correo'),
            directores: editado.directores.map((d, i) => ({
                id: d.id, nombres: valor(`d${i}-nombres`), apellidos: valor(`d${i}-apellidos`),
                email: valor(`d${i}-email`), telefono: valor(`d${i}-telefono`),
            })),
        });
        btn.disabled = true;
        btn.querySelector('.btn__label').textContent = 'Guardando…';
        try {
            const r = await Casos.administrarJardines.editar(cambios);
            avisoExito(`Jardín "${r.jardin.nombre}" actualizado.`);
            navegar('jardines');
        } catch (e) {
            avisoError(e.message);
            btn.disabled = false;
            btn.querySelector('.btn__label').textContent = 'Guardar cambios';
        }
    });
}
