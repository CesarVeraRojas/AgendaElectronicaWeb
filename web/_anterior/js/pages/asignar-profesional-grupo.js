/**
 * asignar-profesional-grupo.js — Página: Asignar Profesional a Grupo
 * Estado: STUB — será implementada en su fase correspondiente.
 */
import { renderTopBar } from '../components.js';
import { goBack } from '../router.js';

export function render() {
    return `
        <div class="page">
            ${renderTopBar({ title: 'Asignar Profesional a Grupo', showBack: true })}
            <div class="page-content">
                <div class="empty-state">
                    <span class="material-icons">assignment_ind</span>
                    <p class="text-body-medium">Esta sección estará disponible próximamente.</p>
                </div>
            </div>
        </div>`;
}

export function init() {
    document.getElementById('btn-back')?.addEventListener('click', goBack);
}
