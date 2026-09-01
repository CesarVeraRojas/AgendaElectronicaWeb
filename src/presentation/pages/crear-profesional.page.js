/**
 * crear-profesional.page.js — Alta de profesional.
 * Espejo de: CrearProfesionalScreen.kt + CrearProfesionalViewModel.kt
 */
import { Casos }       from '../../core/container.js';
import { html, crudo } from '../components/html.js';
import { topBar, seccion, campoTexto, campoSelect, botonPrimario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

/** Misma lista de tipos de documento que usa el formulario de Android. */
const TIPOS_DOCUMENTO = ['CC', 'CE', 'PA', 'Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte'];

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Crear Profesional', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Datos Personales', `
                    ${campoSelect({ id: 'tipo_doc', etiqueta: 'Tipo de Documento', opciones: TIPOS_DOCUMENTO, requerido: true })}
                    ${campoTexto({ id: 'documento', etiqueta: 'Número de Documento', requerido: true })}
                    ${campoTexto({ id: 'nombres',   etiqueta: 'Nombres',   requerido: true })}
                    ${campoTexto({ id: 'apellidos', etiqueta: 'Apellidos', requerido: true })}`))}

                ${crudo(seccion('Datos de Contacto y Acceso', `
                    ${campoTexto({ id: 'telefono', etiqueta: 'Teléfono (Opcional)', tipo: 'tel' })}
                    ${campoTexto({ id: 'email',    etiqueta: 'Email (Opcional)',    tipo: 'email' })}
                    ${campoTexto({ id: 'password', etiqueta: 'Contraseña', tipo: 'password', requerido: true })}`))}

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Profesional' }))}
            </div>
        </div>`;
}

export function init() {
    const btn = document.getElementById('btn-guardar');
    const campos = ['tipo_doc', 'documento', 'nombres', 'apellidos', 'telefono', 'email', 'password'];

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.crearProfesional.ejecutar({
                sesion: Casos.obtenerSesion.ejecutar(),
                datos: {
                    tipoDocumento: document.getElementById('tipo_doc').value,
                    documento:     document.getElementById('documento').value,
                    nombres:       document.getElementById('nombres').value,
                    apellidos:     document.getElementById('apellidos').value,
                    telefono:      document.getElementById('telefono').value,
                    email:         document.getElementById('email').value,
                    password:      document.getElementById('password').value,
                },
            });
            avisoExito(msg);
            campos.forEach(id => { document.getElementById(id).value = ''; });
        } catch (e) {
            avisoError(e.message);
        } finally {
            btn.disabled = false;
        }
    });
}
