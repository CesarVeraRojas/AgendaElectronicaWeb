/**
 * actualizar-datos.page.js — Corrección de datos ya registrados (sólo director).
 *
 * No existe en Android: es una pantalla propia de la web. Cubre el caso de
 * "quedó mal escrito" o "cambió el correo", sin ninguna operación de borrado.
 *
 * Tres pasos en una sola ruta: elegir el tipo → buscar el registro → editarlo.
 * Los campos de cada tipo son exactamente los que acepta su endpoint de
 * actualización; la contraseña queda fuera a propósito.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import {
    topBar, seccion, campoTexto, campoSelect, campoArea,
    botonPrimario, botonSecundario, spinner, estadoVacio, bloqueError,
} from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

/**
 * Vocabularios que acepta CADA endpoint, que no son los del formulario de alta.
 *
 * `agregar_estudiante.php` traduce 'Masculino'→'M' y 'Femenino'→'F' antes de
 * guardar, así que en la tabla vive M/F/OTRO. `editar_estudiante.php` valida
 * contra esos mismos códigos pero NO hace la traducción, de modo que enviarle
 * la palabra completa da 400. Se guarda el código y se muestra la palabra.
 */
const GENEROS = [
    { valor: 'M',    etiqueta: 'Masculino' },
    { valor: 'F',    etiqueta: 'Femenino'  },
    { valor: 'OTRO', etiqueta: 'Otro'      },
];

/**
 * El alta acepta CC, TI, RC, CE, PA y NUIP; la edición acepta las cinco
 * primeras pero se dejó NUIP fuera. Se ofrecen todas para que un estudiante
 * dado de alta con NUIP muestre su valor real; si se elige NUIP, el backend
 * responderá 400 hasta que se añada allí.
 */
const TIPOS_DOC_ESTUDIANTE = ['NUIP', 'TI', 'CC', 'RC', 'CE', 'PA'];
const TIPOS_DOC_ADULTO     = ['CC', 'CE', 'PA', 'Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte'];
const PARENTESCOS          = ['Papá', 'Mamá', 'Abuelo', 'Abuela', 'Tío', 'Tía', 'Otro'];

/**
 * Si el valor guardado no está entre las opciones, el <select> se quedaría en
 * blanco y la validación de obligatorios bloquearía el formulario entero por un
 * campo que el usuario ni siquiera quería tocar. Añadirlo como opción propia
 * hace que el dato siempre se vea y que no se pierda al guardar.
 */
function conValorGuardado(opciones, valor) {
    if (!valor) return opciones;
    const existe = opciones.some(o => String(typeof o === 'string' ? o : o.valor) === String(valor));
    return existe ? opciones : [{ valor, etiqueta: valor }, ...opciones];
}

/**
 * Configuración por tipo. Concentra en un solo sitio qué se lista, cómo se
 * relee, qué campos se pintan y qué caso de uso guarda, de modo que añadir un
 * tipo nuevo no obligue a tocar la lógica de la pantalla.
 */
const TIPOS = {
    acudiente: {
        etiqueta: 'Acudiente',
        listar:   () => Casos.listarPadres.ejecutar(),
        // Se relee la ficha antes de editar. Estudiante y grupo no tienen un
        // endpoint equivalente, así que ahí se usa la fila de la lista.
        releer:   (id) => Casos.obtenerPadre.ejecutar(id),
        guardar:  (args) => Casos.actualizarPadre.ejecutar(args),
        titulo:   (r) => `${r.nombres} ${r.apellidos}`.trim(),
        subtitulo:(r) => [r.parentesco, r.documento].filter(Boolean).join(' · '),
        campos: [
            { id: 'tipoDocumento', etiqueta: 'Tipo de Documento',   tipo: 'select', opciones: TIPOS_DOC_ADULTO },
            { id: 'documento',     etiqueta: 'Número de Documento' },
            { id: 'nombres',       etiqueta: 'Nombres' },
            { id: 'apellidos',     etiqueta: 'Apellidos' },
            { id: 'parentesco',    etiqueta: 'Parentesco',          tipo: 'select', opciones: PARENTESCOS },
            { id: 'telefono',      etiqueta: 'Teléfono',            tipo: 'tel' },
            { id: 'email',         etiqueta: 'Email',               tipo: 'email' },
            { id: 'direccion',     etiqueta: 'Dirección' },
        ],
    },

    profesional: {
        etiqueta: 'Profesional',
        listar:   () => Casos.obtenerProfesionales.ejecutar(Casos.obtenerSesion.ejecutar()),
        releer:   (id) => Casos.obtenerProfesional.ejecutar(id),
        guardar:  (args) => Casos.actualizarProfesional.ejecutar(args),
        titulo:   (r) => `${r.nombres} ${r.apellidos}`.trim(),
        subtitulo:(r) => [r.documento, r.email].filter(Boolean).join(' · '),
        campos: [
            { id: 'tipoDocumento', etiqueta: 'Tipo de Documento',   tipo: 'select', opciones: TIPOS_DOC_ADULTO },
            { id: 'documento',     etiqueta: 'Número de Documento' },
            { id: 'nombres',       etiqueta: 'Nombres' },
            { id: 'apellidos',     etiqueta: 'Apellidos' },
            { id: 'telefono',      etiqueta: 'Teléfono',            tipo: 'tel' },
            { id: 'email',         etiqueta: 'Email',               tipo: 'email' },
        ],
    },

    estudiante: {
        etiqueta: 'Estudiante',
        listar:   () => Casos.listarEstudiantes.ejecutar(),
        releer:   null,
        guardar:  (args) => Casos.actualizarEstudiante.ejecutar(args),
        titulo:   (r) => `${r.nombres} ${r.apellidos}`.trim(),
        subtitulo:(r) => [r.documento, r.genero].filter(Boolean).join(' · '),
        campos: [
            { id: 'tipoDocumento',   etiqueta: 'Tipo de Documento',    tipo: 'select', opciones: TIPOS_DOC_ESTUDIANTE },
            { id: 'documento',       etiqueta: 'Número de Documento' },
            { id: 'nombres',         etiqueta: 'Nombres' },
            { id: 'apellidos',       etiqueta: 'Apellidos' },
            { id: 'fechaNacimiento', etiqueta: 'Fecha de Nacimiento',  tipo: 'date' },
            { id: 'genero',          etiqueta: 'Género',               tipo: 'select', opciones: GENEROS },
            { id: 'direccion',       etiqueta: 'Dirección' },
            { id: 'telefono',        etiqueta: 'Teléfono',             tipo: 'tel' },
            { id: 'email',           etiqueta: 'Email',                tipo: 'email' },
        ],
    },

    grupo: {
        etiqueta: 'Grupo',
        listar:   () => Casos.obtenerGruposDelUsuario.ejecutar(Casos.obtenerSesion.ejecutar()),
        releer:   null,
        guardar:  (args) => Casos.actualizarGrupo.ejecutar(args),
        titulo:   (r) => r.nombreGrupo ?? '',
        subtitulo:(r) => r.descripcion ?? '',
        campos: [
            { id: 'nombreGrupo', etiqueta: 'Nombre del Grupo' },
            { id: 'descripcion', etiqueta: 'Descripción', tipo: 'area' },
        ],
    },
};

let tipoActual = 'acudiente';
let registros  = [];
let original   = null;   // la ficha tal como vino del servidor

export function render() {
    tipoActual = 'acudiente';
    registros  = [];
    original   = null;

    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Actualizar Datos', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('¿Qué desea corregir?', campoSelect({
                    id: 'tipo',
                    etiqueta: 'Tipo de registro',
                    opciones: Object.entries(TIPOS).map(([v, t]) => ({ valor: v, etiqueta: t.etiqueta })),
                    valor: 'acudiente',
                    placeholder: null,
                })))}

                ${crudo(seccion('Buscar', `
                    ${campoTexto({ id: 'buscador', etiqueta: 'Nombre o documento', placeholder: 'Escriba para filtrar…' })}
                    <div id="lista"></div>`))}

                <div id="editor" hidden></div>
            </div>
        </div>`;
}

export async function init() {
    const selTipo  = document.getElementById('tipo');
    const buscador = document.getElementById('buscador');

    selTipo.addEventListener('change', () => {
        tipoActual = selTipo.value;
        buscador.value = '';
        cerrarEditor();
        cargarLista();
    });

    buscador.addEventListener('input', pintarLista);

    await cargarLista();
}

async function cargarLista() {
    const contenedor = document.getElementById('lista');
    contenedor.innerHTML = spinner('Cargando…');
    try {
        registros = await TIPOS[tipoActual].listar();
    } catch (e) {
        registros = [];
        contenedor.innerHTML = bloqueError(e.message);
        return;
    }
    pintarLista();
}

/** Filtra en memoria: las listas del colegio son pequeñas y evita ir a la red. */
function pintarLista() {
    const contenedor = document.getElementById('lista');
    const cfg   = TIPOS[tipoActual];
    const termino = (document.getElementById('buscador')?.value ?? '').trim().toLowerCase();

    const visibles = termino
        ? registros.filter(r => `${cfg.titulo(r)} ${cfg.subtitulo(r)}`.toLowerCase().includes(termino))
        : registros;

    if (!registros.length) {
        contenedor.innerHTML = estadoVacio(`No hay ${cfg.etiqueta.toLowerCase()}s registrados.`, 'person_off');
        return;
    }
    if (!visibles.length) {
        contenedor.innerHTML = estadoVacio('Ningún registro coincide con la búsqueda.', 'search_off');
        return;
    }

    contenedor.innerHTML = visibles.map(r => html`
        <button class="pick-row pick-row--action" data-id="${r.id}">
            <span class="pick-row__name">${cfg.titulo(r)}</span>
            <span class="pick-row__type">${cfg.subtitulo(r)}</span>
        </button>`).join('');

    contenedor.querySelectorAll('.pick-row--action').forEach(fila => {
        fila.addEventListener('click', () => abrirEditor(fila.dataset.id));
    });
}

async function abrirEditor(id) {
    const cfg    = TIPOS[tipoActual];
    const editor = document.getElementById('editor');
    editor.hidden = false;
    editor.innerHTML = spinner('Cargando ficha…');

    const deLaLista = registros.find(r => String(r.id) === String(id));
    try {
        original = cfg.releer ? await cfg.releer(id) : deLaLista;
    } catch (e) {
        editor.innerHTML = bloqueError(e.message);
        return;
    }
    if (!original) {
        editor.innerHTML = bloqueError('No se encontró el registro seleccionado.');
        return;
    }

    const campos = cfg.campos.map(c => {
        const valor = original[c.id] ?? '';
        if (c.tipo === 'select') {
            return campoSelect({
                id: `f_${c.id}`, etiqueta: c.etiqueta,
                opciones: conValorGuardado(c.opciones, valor), valor,
            });
        }
        if (c.tipo === 'area') {
            return campoArea({ id: `f_${c.id}`, etiqueta: c.etiqueta, valor, filas: 4 });
        }
        return campoTexto({ id: `f_${c.id}`, etiqueta: c.etiqueta, tipo: c.tipo ?? 'text', valor });
    }).join('');

    editor.innerHTML = html`
        ${crudo(seccion(`Editando: ${esc(cfg.titulo(original))}`, campos))}
        <div class="acciones-fila">
            ${crudo(botonPrimario({ id: 'btn-guardar',  texto: 'Guardar Cambios' }))}
            ${crudo(botonSecundario({ id: 'btn-cancelar', texto: 'Cancelar' }))}
        </div>`;

    document.getElementById('btn-cancelar').addEventListener('click', cerrarEditor);
    document.getElementById('btn-guardar').addEventListener('click', guardar);
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function guardar() {
    const cfg = TIPOS[tipoActual];
    const btn = document.getElementById('btn-guardar');

    const editado = {};
    cfg.campos.forEach(c => { editado[c.id] = document.getElementById(`f_${c.id}`).value; });

    btn.disabled = true;
    try {
        // El caso de uso calcula el diff, valida los obligatorios y decide si
        // hay algo que enviar; la pantalla sólo recoge valores.
        const mensaje = await cfg.guardar({ original, editado });
        avisoExito(mensaje);
        cerrarEditor();
        await cargarLista();   // que la lista refleje lo que quedó en el servidor
    } catch (e) {
        avisoError(e.message);
    } finally {
        btn.disabled = false;
    }
}

function cerrarEditor() {
    original = null;
    const editor = document.getElementById('editor');
    if (editor) {
        editor.hidden = true;
        editor.innerHTML = '';
    }
}
