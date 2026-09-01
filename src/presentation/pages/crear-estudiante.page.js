/**
 * crear-estudiante.page.js — Alta completa de estudiante con acudientes.
 * Espejo de: CrearEstudianteActivity.kt + CrearEstudianteViewModel.kt
 *
 * Las listas de los desplegables se copian literalmente de la Activity de
 * Android (líneas 83-114), porque el backend valida contra esos mismos valores.
 * El segundo acudiente es opcional y sólo se envía si TODOS sus campos vienen
 * llenos: esa regla vive en la entidad Acudiente, no aquí.
 *
 * La orquestación de las 5 llamadas encadenadas está en el caso de uso
 * CrearEstudianteCompleto.
 */
import { Casos }              from '../../core/container.js';
import { Acudiente }          from '../../domain/entities/Estudiante.js';
import { html, esc, crudo }   from '../components/html.js';
import { topBar, seccion, campoTexto, campoSelect, botonPrimario } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

// Listas idénticas a las de CrearEstudianteActivity.kt
const TIPOS_DOC_ESTUDIANTE = ['NUIP', 'TI'];
const GENEROS              = ['Masculino', 'Femenino', 'Otro'];
const TIPOS_DOC_ACUDIENTE  = ['CC', 'CE', 'PA', 'Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte'];
const PARENTESCOS          = ['Papá', 'Mamá', 'Abuelo', 'Abuela', 'Tío', 'Tía', 'Otro'];

/** Genera los 9 campos de un acudiente con prefijo (a1_ / a2_). */
function camposAcudiente(prefijo) {
    return `
        ${campoSelect({ id: `${prefijo}_tipo_doc`, etiqueta: 'Tipo de Documento', opciones: TIPOS_DOC_ACUDIENTE })}
        ${campoTexto({ id: `${prefijo}_documento`, etiqueta: 'Número de Documento' })}
        ${campoTexto({ id: `${prefijo}_nombres`,   etiqueta: 'Nombres' })}
        ${campoTexto({ id: `${prefijo}_apellidos`, etiqueta: 'Apellidos' })}
        ${campoSelect({ id: `${prefijo}_parentesco`, etiqueta: 'Parentesco', opciones: PARENTESCOS })}
        ${campoTexto({ id: `${prefijo}_telefono`,  etiqueta: 'Teléfono', tipo: 'tel' })}
        ${campoTexto({ id: `${prefijo}_direccion`, etiqueta: 'Dirección' })}
        ${campoTexto({ id: `${prefijo}_email`,     etiqueta: 'Email', tipo: 'email' })}
        ${campoTexto({ id: `${prefijo}_password`,  etiqueta: 'Contraseña', tipo: 'password' })}`;
}

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Crear Estudiante', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Datos del Estudiante', `
                    ${campoSelect({ id: 'e_tipo_doc', etiqueta: 'Tipo de Documento', opciones: TIPOS_DOC_ESTUDIANTE, requerido: true })}
                    ${campoTexto({ id: 'e_documento', etiqueta: 'Número de Documento', requerido: true })}
                    ${campoTexto({ id: 'e_nombres',   etiqueta: 'Nombres',   requerido: true })}
                    ${campoTexto({ id: 'e_apellidos', etiqueta: 'Apellidos', requerido: true })}
                    ${campoTexto({ id: 'e_fecha_nac', etiqueta: 'Fecha de Nacimiento', tipo: 'date', requerido: true })}
                    ${campoSelect({ id: 'e_genero',   etiqueta: 'Género', opciones: GENEROS, requerido: true })}
                    ${campoTexto({ id: 'e_direccion', etiqueta: 'Dirección' })}
                    ${campoTexto({ id: 'e_telefono',  etiqueta: 'Teléfono', tipo: 'tel' })}
                    ${campoTexto({ id: 'e_email',     etiqueta: 'Email', tipo: 'email' })}
                    ${campoSelect({ id: 'e_grupo',    etiqueta: 'Grupo', opciones: [], placeholder: 'Cargando…', deshabilitado: true, requerido: true })}`))}

                ${crudo(seccion('Acudiente 1 (obligatorio)', camposAcudiente('a1')))}
                ${crudo(seccion('Acudiente 2 (opcional)', `
                    <p class="hint">Sólo se registrará si completa todos los campos de esta sección.</p>
                    ${camposAcudiente('a2')}`))}

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Estudiante' }))}
            </div>
        </div>`;
}

const valor = (id) => document.getElementById(id)?.value ?? '';

function leerAcudiente(prefijo) {
    return new Acudiente({
        tipoDocumento: valor(`${prefijo}_tipo_doc`),
        documento:     valor(`${prefijo}_documento`),
        nombres:       valor(`${prefijo}_nombres`),
        apellidos:     valor(`${prefijo}_apellidos`),
        parentesco:    valor(`${prefijo}_parentesco`),
        telefono:      valor(`${prefijo}_telefono`),
        direccion:     valor(`${prefijo}_direccion`),
        email:         valor(`${prefijo}_email`),
        password:      valor(`${prefijo}_password`),
    });
}

export async function init() {
    const sesion   = Casos.obtenerSesion.ejecutar();
    const selGrupo = document.getElementById('e_grupo');
    const btn      = document.getElementById('btn-guardar');

    try {
        const grupos = await Casos.obtenerGruposDelUsuario.ejecutar(sesion);
        selGrupo.innerHTML = `<option value="">Seleccione un grupo…</option>` +
            grupos.map(g => `<option value="${esc(g.id)}">${esc(g.nombreGrupo)}</option>`).join('');
        selGrupo.disabled = false;
    } catch (e) {
        avisoError(e.message);
    }

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.crearEstudianteCompleto.ejecutar({
                sesion,
                estudiante: {
                    tipoDocumento:   valor('e_tipo_doc'),
                    documento:       valor('e_documento'),
                    nombres:         valor('e_nombres'),
                    apellidos:       valor('e_apellidos'),
                    fechaNacimiento: valor('e_fecha_nac'),
                    genero:          valor('e_genero'),
                    direccion:       valor('e_direccion'),
                    telefono:        valor('e_telefono'),
                    email:           valor('e_email'),
                },
                acudiente1: leerAcudiente('a1'),
                acudiente2: leerAcudiente('a2'),
                grupoId:    selGrupo.value,
            });
            avisoExito(msg);
            document.querySelectorAll('.page-content input').forEach(i => { i.value = ''; });
            document.querySelectorAll('.page-content select').forEach(s => { s.value = ''; });
        } catch (e) {
            avisoError(e.message);
        } finally {
            btn.disabled = false;
        }
    });
}
