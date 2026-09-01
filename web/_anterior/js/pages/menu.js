/**
 * menu.js — Main menu screen (stub funcional)
 * Será completamente rediseñado en la Fase 3.
 * Implementa la lógica de menú dinámico por rol igual que en MenuScreen.kt.
 */
import { Auth } from '../auth.js';
import { navigate } from '../router.js';
import { renderTopBar } from '../components.js';

// Mirrors the MenuOption data class and the role-based menu logic in MenuScreen.kt
function getMenuOptions(userType) {
    const primary   = 'menu-card--primary';
    const secondary = 'menu-card--secondary';
    const tertiary  = 'menu-card--tertiary';
    const options   = [];

    if (userType === 'director') {
        options.push({ label: 'Crear Estudiante',       icon: 'person_add',      route: 'crear-estudiante',          color: primary });
        options.push({ label: 'Crear Grupo',            icon: 'group_add',       route: 'crear-grupo',               color: secondary });
        options.push({ label: 'Crear Profesional',      icon: 'badge',           route: 'crear-profesional',         color: tertiary });
        options.push({ label: 'Asignar Prof. a Grupo',  icon: 'assignment_ind',  route: 'asignar-profesional-grupo', color: primary });
    }

    if (userType === 'profesional' || userType === 'director') {
        options.push({ label: 'Asistencia',   icon: 'check_circle',  route: 'asistencia',   color: secondary });
        options.push({ label: 'Observaciones',icon: 'edit_note',     route: 'observaciones', color: tertiary });
        options.push({ label: 'Agenda Diaria',icon: 'calendar_today',route: 'agenda-diaria', color: primary });
        options.push({ label: 'Fotos',        icon: 'photo_camera',  route: 'fotos',         color: secondary });
    }

    if (userType === 'padre') {
        options.push({ label: 'Agenda Diaria',icon: 'calendar_today',route: 'agenda-diaria-hijo',  color: primary });
        options.push({ label: 'Observaciones',icon: 'edit_note',     route: 'observaciones-hijo', color: secondary });
        options.push({ label: 'Fotos',        icon: 'photo_library', route: 'fotos-hijo',          color: tertiary });
    }

    // Mensajes is available to all roles
    options.push({ label: 'Mensajes', icon: 'email', route: 'mensajes', color: tertiary });

    return options;
}

export function render() {
    const userType = Auth.userType;
    const nombres  = Auth.nombres ?? '';
    const options  = getMenuOptions(userType);

    const cardsHtml = options.map(opt => `
        <button class="menu-card ${opt.color}" data-route="${opt.route}">
            <span class="material-icons">${opt.icon}</span>
            ${opt.label}
        </button>`).join('');

    return `
        <div class="page">
            ${renderTopBar({
                title: 'Menú Principal',
                actions: [{ id: 'btn-logout', icon: 'logout', label: 'Cerrar sesión' }]
            })}

            <div class="page-content" style="display:flex; flex-direction:column; align-items:center;">

                <img src="assets/agenda_kids.jpeg"
                     alt="Agenda Electrónica"
                     style="width:100%; max-width:500px; height:160px; object-fit:cover; border-radius:16px; margin-bottom:12px;" />

                ${nombres ? `<p style="font-size:20px; font-weight:400; color:var(--primary-dark); margin-bottom:16px; text-align:center;">
                    Bienvenido, ${nombres}
                </p>` : ''}

                <div class="menu-grid" style="width:100%;">
                    ${cardsHtml}
                </div>

            </div>

            <div class="footer-info" id="footer-colegio">
                <p>Cargando datos del colegio...</p>
            </div>
        </div>`;
}

export async function init() {
    // Logout button
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        Auth.clearSession();
        navigate('login');
    });

    // Menu card navigation
    document.querySelectorAll('.menu-card[data-route]').forEach(card => {
        card.addEventListener('click', () => {
            navigate(card.dataset.route);
        });
    });

    // Load college details (for padre and profesional — mirrors MenuViewModel)
    const colegioId = Auth.colegioId;
    const userType  = Auth.userType;
    if (colegioId && (userType === 'padre' || userType === 'profesional')) {
        try {
            const { Api } = await import('../api.js');
            const data = await Api.getColegioDetails(colegioId);
            if (data.success && data.colegio) {
                document.getElementById('footer-colegio').innerHTML = `
                    <p><strong>${data.colegio.nombre}</strong></p>
                    <p>${data.colegio.direccion}</p>`;
            } else {
                document.getElementById('footer-colegio').innerHTML = '';
            }
        } catch {
            document.getElementById('footer-colegio').innerHTML = '';
        }
    } else {
        document.getElementById('footer-colegio').innerHTML = '';
    }
}
