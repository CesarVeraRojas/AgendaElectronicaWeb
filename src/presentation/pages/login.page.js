/**
 * login.page.js — Pantalla de inicio de sesión.
 * Espejo de: ui/login/LoginScreen.kt + LoginViewModel.kt
 *
 * Estados de LoginUiState replicados: Idle / Loading / Error / Success.
 * La pantalla no sabe nada de la red: delega en el caso de uso IniciarSesion.
 */
import { Casos }      from '../../core/container.js';
import { navegar }    from '../router/index.js';
import { campoTexto, botonPrimario } from '../components/ui.js';
import { avisoError } from '../components/avisos.js';

export function render() {
    return `
        <div class="login-page">
            <div class="login-card">
                <img class="login-logo" src="assets/agenda_kids.jpeg" alt="Happy Children" />
                <h1 class="login-title">¡Bienvenido!</h1>

                <form id="form-login" class="login-form" novalidate>
                    ${campoTexto({ id: 'email',    etiqueta: 'Correo electrónico', tipo: 'email',    requerido: true, placeholder: 'usuario@correo.com' })}
                    ${campoTexto({ id: 'password', etiqueta: 'Contraseña',         tipo: 'password', requerido: true, placeholder: '••••••••' })}
                    <div id="login-error" class="alert alert--error" hidden></div>
                    ${botonPrimario({ id: 'btn-login', texto: 'Iniciar Sesión' })}
                </form>
            </div>
        </div>`;
}

export function init() {
    const form  = document.getElementById('form-login');
    const boton = document.getElementById('btn-login');
    const error = document.getElementById('login-error');
    const email = document.getElementById('email');
    const clave = document.getElementById('password');

    const cargando = (activo) => {
        boton.disabled = activo;
        boton.classList.toggle('btn--loading', activo);
        boton.querySelector('.btn__label').textContent = activo ? 'Ingresando…' : 'Iniciar Sesión';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        error.hidden = true;
        cargando(true);

        try {
            await Casos.iniciarSesion.ejecutar(email.value, clave.value);
            navegar('menu');
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
            avisoError(err.message);
        } finally {
            cargando(false);
        }
    });

    email.focus();
}
