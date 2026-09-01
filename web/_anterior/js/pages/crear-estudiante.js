/**
 * crear-estudiante.js — Página: Crear Estudiante
 * Estado: STUB — será implementada en su fase correspondiente.
 */
import { renderTopBar } from '../components.js';
import { goBack } from '../router.js';

export function render() {
    return `
        <div class="page">
            ${renderTopBar({ title: 'Crear Estudiante', showBack: true })}
            <div class="page-content">
                <div class="empty-state">
                    <span class="material-icons">person_add</span>
                    <p class="text-body-medium">Esta sección estará disponible próximamente.</p>
                </div>
            </div>
        </div>`;
}

export function init() {
    document.getElementById('btn-back')?.addEventListener('click', goBack);
}
