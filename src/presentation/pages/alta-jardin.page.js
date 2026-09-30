/**
 * alta-jardin.page.js — Soporte da de alta un jardín con su primer director (BL-74).
 *
 * Al terminar muestra lo que soporte tiene que entregar al director: el correo
 * con que entra, la contraseña inicial (sólo se ve aquí, una vez) y con qué
 * nombre subir el logo del jardín (BL-75).
 */
import { Casos }       from '../../core/container.js';
import { navegar }     from '../router/index.js';
import { NuevoJardin, TIPOS_DOCUMENTO_DIRECTOR, MIN_CONTRASENA_DIRECTOR, generarContrasena } from '../../domain/entities/Jardin.js';
import { html, crudo } from '../components/html.js';
import { topBar, seccion, campoTexto, campoSelect, botonPrimario, botonSecundario } from '../components/ui.js';
import { avisoError }  from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Nuevo jardín', volverA: 'jardines' }))}
            <div class="page-content" id="contenido">
                ${crudo(seccion('El jardín', [
                    campoTexto({ id: 'j-nombre', etiqueta: 'Nombre del jardín', requerido: true, placeholder: 'Ej.: Jardín Infantil Arcoíris' }),
                    campoTexto({ id: 'j-direccion', etiqueta: 'Dirección' }),
                    campoTexto({ id: 'j-correo', etiqueta: 'Correo del jardín', tipo: 'email' }),
                ].join('')))}
                ${crudo(seccion('Su director o directora', [
                    campoTexto({ id: 'd-nombres', etiqueta: 'Nombres', requerido: true }),
                    campoTexto({ id: 'd-apellidos', etiqueta: 'Apellidos', requerido: true }),
                    campoSelect({ id: 'd-tipo', etiqueta: 'Tipo de documento', placeholder: '', valor: 'CC',
                                  opciones: TIPOS_DOCUMENTO_DIRECTOR.map(t => ({ valor: t.valor, etiqueta: t.etiqueta })) }),
                    campoTexto({ id: 'd-documento', etiqueta: 'Número de documento', requerido: true }),
                    campoTexto({ id: 'd-email', etiqueta: 'Correo (con este entra a AgendaKids)', tipo: 'email', requerido: true }),
                    campoTexto({ id: 'd-telefono', etiqueta: 'Teléfono', tipo: 'tel' }),
                    campoTexto({ id: 'd-password', etiqueta: `Contraseña inicial (mínimo ${MIN_CONTRASENA_DIRECTOR} caracteres)`, requerido: true, valor: generarContrasena() }),
                    '<p class="field__ayuda">Ya va una contraseña generada; puede cambiarla. Entréguela al director para su primer ingreso.</p>',
                ].join('')))}
                ${crudo(botonPrimario({ id: 'btn-crear', texto: 'Dar de alta', icono: 'add_business' }))}
            </div>
        </div>`;
}

const valor = (id) => document.getElementById(id).value;

export function init() {
    const btn = document.getElementById('btn-crear');
    btn.addEventListener('click', async () => {
        const nuevo = new NuevoJardin({
            nombre: valor('j-nombre'), direccion: valor('j-direccion'), correo: valor('j-correo'),
            director: {
                nombres: valor('d-nombres'), apellidos: valor('d-apellidos'), tipoDocumento: valor('d-tipo'),
                documento: valor('d-documento'), email: valor('d-email'), telefono: valor('d-telefono'),
                password: valor('d-password'),
            },
        });
        btn.disabled = true;
        btn.querySelector('.btn__label').textContent = 'Dando de alta…';
        try {
            const r = await Casos.administrarJardines.darDeAlta(nuevo);
            mostrarResumen(r, nuevo.director.password);
        } catch (e) {
            avisoError(e.message);
            btn.disabled = false;
            btn.querySelector('.btn__label').textContent = 'Dar de alta';
        }
    });
}

/** Lo que soporte tiene que entregar. La contraseña no se vuelve a mostrar. */
function mostrarResumen(r, password) {
    document.getElementById('contenido').innerHTML = html`
        <section class="card card--section">
            <h2 class="card__title">Jardín creado: ${r.jardin.nombre}</h2>
            <div class="card__body">
                <p>Entregue estos datos al director para su primer ingreso:</p>
                <p class="jardin__dato"><span class="material-icons">person</span>${r.director.nombre}</p>
                <p class="jardin__dato"><span class="material-icons">mail</span>Correo: <strong>${r.director.email}</strong></p>
                <p class="jardin__dato"><span class="material-icons">key</span>Contraseña inicial: <strong>${password}</strong></p>
                <p class="field__ayuda">La contraseña no se volverá a mostrar. Cópiela ahora.</p>
                <p class="jardin__dato jardin__dato--aviso"><span class="material-icons">image</span>Logo: súbalo como ${r.logoEsperado} en uploads/logos</p>
            </div>
        </section>
        ${crudo(botonSecundario({ id: 'btn-volver', texto: 'Volver a los jardines', icono: 'arrow_back', ancho: true }))}`;
    document.getElementById('btn-volver').addEventListener('click', () => navegar('jardines'));
}
