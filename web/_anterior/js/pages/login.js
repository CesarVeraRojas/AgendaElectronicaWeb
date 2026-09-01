/**
 * login.js — Pantalla de Login
 * Mirrors: ui/login/LoginScreen.kt + ui/login/LoginViewModel.kt
 *
 * Estados replicados de LoginUiState (sealed class):
 *   Idle    → formulario normal, botón activo
 *   Loading → botón deshabilitado, muestra spinner (CircularProgressIndicator)
 *   Error   → muestra mensaje de error debajo del botón
 *   Success → guarda sesión en Auth y navega a menu
 */

import { Api }      from '../api.js';
import { Auth }     from '../auth.js';
import { navigate } from '../router.js';
import { escHtml }  from '../components.js';

// Mirrors sealed class LoginUiState
const UiState = { IDLE: 'idle', LOADING: 'loading', ERROR: 'error' };

// ─────────────────────────────────────────────────────────────
// render()
// Mirrors: @Composable fun LoginScreen(...)
//
// Layout:
//   Box (fillMaxSize, verticalGradient background)
//     └─ Card (fillMaxWidth, padding 24, RoundedCornerShape 24, elevation 8)
//          └─ Column (center aligned)
//               ├─ Image (agenda_kids, 140dp)
//               ├─ Text "Bienvenido!" (headlineMedium, primary)
//               ├─ OutlinedTextField Email
//               ├─ OutlinedTextField Password
//               └─ Button "Iniciar Sesion" (full width, 50dp)
// ─────────────────────────────────────────────────────────────
export function render() {
    return `
        <style>
            /* ── Login page layout ── */
            .login-page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px 16px;
                /* Mirrors: Brush.verticalGradient(primary 10%, secondary 5%, background) */
                background: linear-gradient(
                    180deg,
                    rgba(79, 195, 247, 0.10) 0%,
                    rgba(129, 199, 132, 0.05) 50%,
                    #F5F9FC 100%
                );
            }

            .login-container {
                width: 100%;
                max-width: 420px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            /* Mirrors: Card(RoundedCornerShape(24.dp), elevation 8dp, surface color) */
            .login-card {
                width: 100%;
                background-color: var(--surface);
                border-radius: 24px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08);
                padding: 32px 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0;
            }

            /* Mirrors: Image(size 140.dp, padding bottom 16) */
            .login-logo {
                width: 140px;
                height: 140px;
                object-fit: cover;
                border-radius: 12px;
                margin-bottom: 16px;
            }

            /* Mirrors: Text("Bienvenido!", headlineMedium, primary) */
            .login-title {
                font-size: 28px;
                font-weight: 400;
                color: var(--primary-dark);
                margin-bottom: 32px;  /* Mirrors: Spacer(32dp) */
                text-align: center;
            }

            /* Mirrors: OutlinedTextField wrapper */
            .login-field {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 12px;  /* Mirrors: Spacer(12dp) between fields */
            }

            .login-field:last-of-type {
                margin-bottom: 28px;  /* Mirrors: Spacer(28dp) before button */
            }

            .login-label {
                font-size: 13px;
                font-weight: 400;
                color: var(--on-surface-variant);
                transition: color 150ms ease;
            }

            /* Mirrors: focused label color change */
            .login-field--focused .login-label {
                color: var(--primary-dark);
            }

            /* Mirrors: error state */
            .login-field--error .login-label {
                color: var(--error);
            }

            .login-field--error .login-input,
            .login-field--error .login-input-wrap {
                border-color: var(--error);
                border-width: 2px;
            }

            /* Mirrors: OutlinedTextField(shape = RoundedCornerShape(12.dp)) */
            .login-input {
                width: 100%;
                height: 52px;
                padding: 0 16px;
                border: 1.5px solid rgba(28, 27, 31, 0.30); /* onSurface.copy(alpha=0.3) */
                border-radius: 12px;
                font-size: 16px;
                font-family: var(--font-family);
                color: var(--on-surface);
                background-color: var(--surface);
                outline: none;
                transition: border-color 150ms ease, border-width 150ms ease;
            }

            /* Mirrors: focusedBorderColor = MaterialTheme.colorScheme.primary */
            .login-input:focus {
                border-color: var(--primary-dark);
                border-width: 2px;
            }

            .login-input:disabled {
                opacity: 0.38;
                cursor: not-allowed;
            }

            /* Password field wrapper (adds visibility toggle — UX web enhancement) */
            .login-input-wrap {
                position: relative;
                display: flex;
                align-items: center;
                border: 1.5px solid rgba(28, 27, 31, 0.30);
                border-radius: 12px;
                background-color: var(--surface);
                transition: border-color 150ms ease, border-width 150ms ease;
            }

            .login-input-wrap:focus-within {
                border-color: var(--primary-dark);
                border-width: 2px;
            }

            .login-input-wrap .login-input {
                border: none;
                border-radius: 12px;
                padding-right: 48px;
                flex: 1;
            }

            .login-input-wrap .login-input:focus {
                border: none;
                box-shadow: none;
            }

            /* Visibility toggle button */
            .login-toggle-pass {
                position: absolute;
                right: 8px;
                width: 40px;
                height: 40px;
                border: none;
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                color: var(--on-surface-variant);
                transition: background-color 150ms ease;
                flex-shrink: 0;
            }

            .login-toggle-pass:hover {
                background-color: var(--surface-variant);
            }

            .login-toggle-pass:disabled {
                opacity: 0.38;
                cursor: not-allowed;
            }

            /* Mirrors: Button(height 50.dp, RoundedCornerShape(12.dp), primary color) */
            .login-btn {
                width: 100%;
                height: 50px;
                border: none;
                border-radius: 12px;
                background-color: var(--primary-dark);
                color: var(--on-primary);
                font-size: 14px;
                font-weight: 500;
                font-family: var(--font-family);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: background-color 150ms ease, box-shadow 150ms ease;
                margin-bottom: 0;
            }

            .login-btn:hover:not(:disabled) {
                background-color: #0277BD;
                box-shadow: 0 4px 12px rgba(2, 136, 209, 0.35);
            }

            .login-btn:disabled {
                opacity: 0.70;
                cursor: not-allowed;
            }

            /* Mirrors: error Text(color = MaterialTheme.colorScheme.error, bodyMedium) */
            .login-alert {
                display: none;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                background-color: var(--error-container);
                color: var(--on-error-container);
                border-left: 4px solid var(--error);
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 16px;
                animation: slide-in 200ms ease;
            }

            .login-alert--visible {
                display: flex;
            }

            @keyframes slide-in {
                from { opacity: 0; transform: translateY(-6px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            /* Mirrors: Text("Agenda Electrónica — Happy Children") in footer area */
            .login-footer {
                font-size: 12px;
                color: var(--on-surface-variant);
                text-align: center;
            }

            /* Card entry animation */
            .login-card {
                animation: card-appear 350ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes card-appear {
                from { opacity: 0; transform: translateY(16px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0)  scale(1); }
            }
        </style>

        <div class="login-page">
            <div class="login-container">
                <div class="login-card">

                    <!-- Logo — mirrors: Image(painterResource(R.drawable.agenda_kids), size 140.dp) -->
                    <img
                        src="assets/agenda_kids.jpeg"
                        alt="Agenda Electrónica"
                        class="login-logo"
                    />

                    <!-- Title — mirrors: Text("Bienvenido!", headlineMedium, primary) -->
                    <h1 class="login-title">¡Bienvenido!</h1>

                    <!-- Error message — mirrors: LoginUiState.Error text block -->
                    <div id="login-alert" class="login-alert" role="alert" aria-live="polite"></div>

                    <!-- Email — mirrors: OutlinedTextField(label="Email", singleLine) -->
                    <div class="login-field" id="field-email">
                        <label class="login-label" for="email">Email</label>
                        <input
                            class="login-input"
                            id="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            autocomplete="username"
                            inputmode="email"
                            spellcheck="false"
                        />
                    </div>

                    <!-- Password — mirrors: OutlinedTextField(visualTransformation=PasswordVisualTransformation) -->
                    <div class="login-field" id="field-password">
                        <label class="login-label" for="password">Contraseña</label>
                        <div class="login-input-wrap" id="pass-wrap">
                            <input
                                class="login-input"
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                autocomplete="current-password"
                            />
                            <button
                                class="login-toggle-pass"
                                id="btn-toggle-pass"
                                type="button"
                                tabindex="-1"
                                aria-label="Mostrar contraseña"
                            >
                                <span class="material-icons" id="toggle-icon" style="font-size:20px">visibility</span>
                            </button>
                        </div>
                    </div>

                    <!-- Button — mirrors: Button(height 50.dp, enabled=!isLoading) -->
                    <button class="login-btn" id="btn-login" type="button">
                        Iniciar Sesión
                    </button>

                </div>

                <!-- Footer -->
                <p class="login-footer">Agenda Electrónica &mdash; Happy Children</p>
            </div>
        </div>`;
}

// ─────────────────────────────────────────────────────────────
// init()
// Mirrors: LaunchedEffect + event handlers in LoginScreen
//          + login() function in LoginViewModel
// ─────────────────────────────────────────────────────────────
export function init() {
    const btnLogin   = document.getElementById('btn-login');
    const emailInput = document.getElementById('email');
    const passInput  = document.getElementById('password');
    const passWrap   = document.getElementById('pass-wrap');
    const alertEl    = document.getElementById('login-alert');
    const btnToggle  = document.getElementById('btn-toggle-pass');
    const toggleIcon = document.getElementById('toggle-icon');

    let state = UiState.IDLE;

    // ── Password visibility toggle (web enhancement, no Android equivalent) ──
    btnToggle.addEventListener('click', () => {
        const isPassword = passInput.type === 'password';
        passInput.type          = isPassword ? 'text' : 'password';
        toggleIcon.textContent  = isPassword ? 'visibility_off' : 'visibility';
        btnToggle.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        passInput.focus();
    });

    // ── Focus styles — mirrors focusedBorderColor logic in Compose ──
    const emailField = document.getElementById('field-email');
    const passField  = document.getElementById('field-password');

    emailInput.addEventListener('focus', () => emailField.classList.add('login-field--focused'));
    emailInput.addEventListener('blur',  () => emailField.classList.remove('login-field--focused'));
    passInput.addEventListener('focus',  () => passField.classList.add('login-field--focused'));
    passInput.addEventListener('blur',   () => passField.classList.remove('login-field--focused'));

    // ── setState — mirrors _uiState.value = LoginUiState.X ──
    function setState(newState, errorMsg = '') {
        state = newState;
        const isLoading = state === UiState.LOADING;

        // Mirrors: enabled = !isLoading on all inputs and button
        btnLogin.disabled   = isLoading;
        emailInput.disabled = isLoading;
        passInput.disabled  = isLoading;
        btnToggle.disabled  = isLoading;

        // Mirrors: if (isLoading) CircularProgressIndicator else Text("Iniciar Sesion")
        btnLogin.innerHTML = isLoading
            ? `<span class="spinner spinner--sm spinner--on-primary"></span>`
            : 'Iniciar Sesión';

        // Mirrors: LoginUiState.Error → Text(state.message, error color)
        if (state === UiState.ERROR) {
            alertEl.innerHTML = `
                <span class="material-icons" style="font-size:18px;flex-shrink:0">error_outline</span>
                <span>${escHtml(errorMsg)}</span>`;
            alertEl.classList.add('login-alert--visible');
        } else {
            alertEl.innerHTML = '';
            alertEl.classList.remove('login-alert--visible');
        }
    }

    // ── Client-side validation (mirrors email.isBlank()/password.isBlank() check) ──
    function validateFields() {
        emailField.classList.remove('login-field--error');
        passField.classList.remove('login-field--error');

        const email    = emailInput.value.trim();
        const password = passInput.value;

        if (!email) {
            emailField.classList.add('login-field--error');
            setState(UiState.ERROR, 'El email no puede estar vacío.');
            emailInput.focus();
            return null;
        }
        if (!password) {
            passField.classList.add('login-field--error');
            setState(UiState.ERROR, 'La contraseña no puede estar vacía.');
            passInput.focus();
            return null;
        }
        return { email, password };
    }

    // ── doLogin — mirrors fun login(email, password) in LoginViewModel ──
    async function doLogin() {
        if (state === UiState.LOADING) return;

        const fields = validateFields();
        if (!fields) return;

        // Mirrors: _uiState.value = LoginUiState.Loading
        setState(UiState.LOADING);

        try {
            const data = await Api.login(fields.email, fields.password);

            if (data.success && data.user) {
                // Mirrors: UserSessionManager.saveSession(type, id, colegioId, nombres, apellidos)
                Auth.saveSession({
                    userType:  data.user_type,
                    userId:    data.user.id,
                    colegioId: data.user.colegio_id,
                    nombres:   data.user.nombres,
                    apellidos: data.user.apellidos,
                });
                // Mirrors: LoginUiState.Success → onLoginSuccess()
                navigate('menu');

            } else {
                // Mirrors: LoginUiState.Error(response.body()!!.message)
                setState(UiState.ERROR, data.message ?? 'Credenciales incorrectas.');
            }

        } catch (err) {
            // Mirrors: catch(e: Exception) → LoginUiState.Error("Network error: ${e.message}")
            setState(UiState.ERROR, `Error de conexión: ${err.message}`);
        }
    }

    // ── Event listeners ──

    btnLogin.addEventListener('click', doLogin);

    // Enter on password → submit (mirrors keyboard IME action)
    passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    // Enter on email → move focus to password
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passInput.focus();
    });

    // Clear field error on typing
    emailInput.addEventListener('input', () => {
        emailField.classList.remove('login-field--error');
        if (state === UiState.ERROR) setState(UiState.IDLE);
    });
    passInput.addEventListener('input', () => {
        passField.classList.remove('login-field--error');
        if (state === UiState.ERROR) setState(UiState.IDLE);
    });

    // Auto-focus on load (mirrors autofocus behavior in Android's first field)
    emailInput.focus();
}
