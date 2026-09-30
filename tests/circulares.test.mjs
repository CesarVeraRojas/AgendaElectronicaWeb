/**
 * circulares.test.mjs — Circulares y documentos (BL-70).
 *
 * Se ejecuta con:  node tests/circulares.test.mjs
 *
 * Espejo de `CircularesTest.kt`: los textos esperados son LOS MISMOS, carácter
 * por carácter, para que las circulares digan lo mismo en el móvil y en la web.
 * Si se cambia una palabra aquí, hay que cambiarla allí.
 */
import { aPaginaDeCirculares, aCircular, aLecturaDeCircular } from '../src/data/dto/mappers.js';
import { Circular, PaginaDeCirculares, NuevaCircular, FamiliaLectora, textoDestino, textoAcuseCircular,
         textoSinCirculares, textoAdjunto, validarCircular, ordenarFamilias, juntarCirculares, sinCircular,
         marcarLeidaEnLista, TEXTO_CONFIRMAR_ELIMINAR_CIRCULAR, MAX_TITULO } from '../src/domain/entities/Circular.js';
import { Novedad } from '../src/domain/entities/Novedad.js';
import { PublicarCircular } from '../src/domain/usecases/PublicarCircular.js';
import { EliminarCircular } from '../src/domain/usecases/EliminarCircular.js';
import { MarcarCircularLeida } from '../src/domain/usecases/MarcarCircularLeida.js';
import { ValidationError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

// Tal como la devuelve circulares.php, con una circular de cada rol.
const RESPUESTA = {
    success: true,
    hoy: '2026-09-30',
    hay_mas: true,
    siguiente: 7,
    circulares: [
        { id: 9, titulo: 'Reunión de padres', texto: 'El viernes a las 7.', adjunto_url: 'https://x/uploads/circulares/circ_a.pdf',
          adjunto_nombre: 'Citación.pdf', adjunto_tipo: 'pdf', grupo_id: null, grupo_nombre: null,
          fecha_publicacion: '2026-09-30 08:15:00', dia: '2026-09-30', publicada_por: 'Carlos Vera', leida: false },
        { id: 7, titulo: 'Salida', texto: '', adjunto_url: null, adjunto_nombre: null, adjunto_tipo: null,
          grupo_id: '1', grupo_nombre: 'Rojo', fecha_publicacion: '2026-09-29 16:00:00', dia: '2026-09-29',
          publicada_por: null, total_destinatarios: 20, total_leidas: '12' },
    ],
};

console.log('\n── El mapeo ──');

const pagina = aPaginaDeCirculares(RESPUESTA);
check('es una PaginaDeCirculares', pagina instanceof PaginaDeCirculares);
check('con sus circulares', pagina.circulares.length === 2 && pagina.circulares[0] instanceof Circular);
check('traduce hay_mas, siguiente y hoy', pagina.hayMas === true && pagina.siguiente === 7 && pagina.hoy === '2026-09-30');
const a = pagina.circulares[0];
check('los campos de la circular', a.id === 9 && a.titulo === 'Reunión de padres' && a.texto === 'El viernes a las 7.'
    && a.adjuntoNombre === 'Citación.pdf' && a.adjuntoTipo === 'pdf' && a.publicadaPor === 'Carlos Vera', JSON.stringify(a));
check('sin grupo: grupoId null', a.grupoId === null && a.grupoNombre === null);
check('la hora sale de la fecha', a.hora === '08:15', a.hora);
check('la familia la ve sin leer', a.leida === false && a.estaSinLeer() === true);
check('tiene adjunto', a.tieneAdjunto() === true);
const b = pagina.circulares[1];
check('el grupo llega como cadena y queda en número', b.grupoId === 1 && b.grupoNombre === 'Rojo');
check('el acuse del director, en números aunque llegue como cadena', b.totalDestinatarios === 20 && b.totalLeidas === 12);
check('sin "leida" (no es familia) queda en null, no en "sin leer"', b.leida === null && b.estaSinLeer() === false);
check('sin adjunto', b.tieneAdjunto() === false);
check('a la familia no le llega el acuse: null, no cero', a.totalDestinatarios === null && a.totalLeidas === null);
check('una respuesta rota no revienta', aPaginaDeCirculares(null).circulares.length === 0 && aPaginaDeCirculares(null).hayMas === false);
check('sin "dia" se toma de la fecha', aCircular({ id: 1, fecha_publicacion: '2026-01-02 08:00:00' }).dia === '2026-01-02');
check('texto null llega como vacío', aCircular({ id: 1, texto: null }).texto === '');

const lectura = aLecturaDeCircular({ success: true, circular_id: 7, total: 3, leidas: 1, destinatarios: [
    { padre_id: 30, nombre: 'Luisa Pena', estudiantes: ['Ana Alvarez', 'Bruno Bermudez'], leida: true, leida_en: '2026-09-30 08:12:00' },
    { padre_id: 31, nombre: 'Jorge Cano', estudiantes: ['Cielo Cardenas'], leida: false, leida_en: null },
    { padre_id: 34, nombre: 'Nueva Familia', estudiantes: ['Eva Estrada'], leida: false, leida_en: null },
]});
check('el acuse: totales', lectura.total === 3 && lectura.leidas === 1);
check('el acuse: familias con sus hijos', lectura.destinatarios[0] instanceof FamiliaLectora
    && lectura.destinatarios[0].estudiantes.length === 2 && lectura.destinatarios[0].leidaEn === '2026-09-30 08:12:00');

console.log('\n── Lo que se dice en pantalla (mismos textos que Android) ──');

check('a todo el colegio', textoDestino(null) === 'Todo el colegio');
check('a un grupo',        textoDestino('Rojo') === 'Grupo Rojo');

check('acuse: nadie la recibe',   textoAcuseCircular({ total: 0, leidas: 0 }) === 'Ninguna familia la recibe todavía');
check('acuse: una familia, sin leer', textoAcuseCircular({ total: 1, leidas: 0 }) === 'La familia aún no la ha leído');
check('acuse: una familia, leída',    textoAcuseCircular({ total: 1, leidas: 1 }) === 'Leída por la familia');
check('acuse: ninguna de varias',     textoAcuseCircular({ total: 20, leidas: 0 }) === 'Ninguna de las 20 familias la ha leído');
check('acuse: algunas',               textoAcuseCircular({ total: 20, leidas: 12 }) === 'Leída por 12 de 20 familias');
check('acuse: todas',                 textoAcuseCircular({ total: 20, leidas: 20 }) === 'Leída por todas las familias (20)');
check('acuse: más lecturas que familias no da "21 de 20"',
    textoAcuseCircular({ total: 20, leidas: 21 }) === 'Leída por todas las familias (20)');

check('sin circulares, al director se le dice cómo empezar',
    textoSinCirculares(true) === 'Todavía no has publicado ninguna circular. Toca "Nueva circular" para enviar la primera.');
check('sin circulares, a los demás que no es un fallo',
    textoSinCirculares(false) === 'El jardín todavía no ha publicado circulares.');

check('el adjunto se llama por su nombre original', textoAdjunto(a) === 'Citación.pdf');
check('sin nombre, un PDF es "Documento PDF"', textoAdjunto({ adjuntoTipo: 'pdf' }) === 'Documento PDF');
check('sin nombre, una imagen es "Imagen adjunta"', textoAdjunto({ adjuntoTipo: 'imagen' }) === 'Imagen adjunta');

check('el aviso antes de retirarla',
    TEXTO_CONFIRMAR_ELIMINAR_CIRCULAR === 'Las familias dejarán de verla y se perderá el registro de quién la leyó. Esta acción no se puede deshacer.');

console.log('\n── Lo que se exige al publicar (lo mismo que el servidor) ──');

check('sin título', validarCircular({ titulo: '  ', texto: 'x' }) === 'El título es obligatorio.');
check('título largo', validarCircular({ titulo: 'a'.repeat(201), texto: 'x' }) === 'El título no puede pasar de 200 caracteres.');
check('200 letras con tilde caben: se cuentan caracteres',
    validarCircular({ titulo: 'ñ'.repeat(MAX_TITULO), texto: 'x' }) === null);
check('texto largo', validarCircular({ titulo: 'T', texto: 't'.repeat(5001) }) === 'El texto no puede pasar de 5000 caracteres.');
check('sin texto ni adjunto', validarCircular({ titulo: 'T', texto: '   ' }) === 'La circular necesita un texto o un archivo adjunto.');
check('sólo adjunto vale', validarCircular({ titulo: 'T', texto: '', tieneAdjunto: true }) === null);
check('sólo texto vale',   validarCircular({ titulo: 'T', texto: 'Hola' }) === null);

console.log('\n── Listas ──');

const familias = lectura.destinatarios;
check('en el acuse van primero las que faltan, y en su orden',
    ordenarFamilias(familias).map(f => f.padreId).join() === '31,34,30');
check('juntar páginas no repite', juntarCirculares(pagina.circulares, [b, new Circular({ id: 3, titulo: 'Vieja' })])
    .map(c => c.id).join() === '9,7,3');
check('retirar la quita de la lista', sinCircular(pagina.circulares, 9).map(c => c.id).join() === '7');
const marcadas = marcarLeidaEnLista(pagina.circulares, 9);
check('marcarla leída quita el punto de esa y sólo de esa',
    marcadas[0].leida === true && marcadas[0] instanceof Circular && marcadas[1] === pagina.circulares[1]);
check('y conserva sus datos', marcadas[0].titulo === 'Reunión de padres' && marcadas[0].hora === '08:15');

console.log('\n── Los casos de uso ──');

const repoFalso = () => {
    const llamadas = { publicar: [], eliminar: [], marcar: [] };
    return {
        llamadas,
        async publicar(n)   { llamadas.publicar.push(n); return new Circular({ id: 99, titulo: n.titulo }); },
        async eliminar(id)  { llamadas.eliminar.push(id); },
        async marcarLeida(id) { llamadas.marcar.push(id); },
    };
};

{
    const repo = repoFalso();
    const caso = new PublicarCircular({ circularRepository: repo });
    let error = null;
    try { await caso.ejecutar(new NuevaCircular({ titulo: '', texto: 'x' })); } catch (e) { error = e; }
    check('publicar sin título → ValidationError y sin tocar la red', error instanceof ValidationError
        && error.message === 'El título es obligatorio.' && repo.llamadas.publicar.length === 0);

    error = null;
    try { await caso.ejecutar(new NuevaCircular({ titulo: 'T' })); } catch (e) { error = e; }
    check('publicar sin texto ni adjunto → ValidationError', error instanceof ValidationError && repo.llamadas.publicar.length === 0);

    const archivo = { name: 'Reglamento.pdf' };
    const hecha = await caso.ejecutar(new NuevaCircular({ titulo: 'Reglamento', adjunto: archivo, grupoId: 2 }));
    check('con título y adjunto se publica', hecha.id === 99 && repo.llamadas.publicar.length === 1
        && repo.llamadas.publicar[0].adjunto === archivo && repo.llamadas.publicar[0].grupoId === 2);
}

{
    const repo = repoFalso();
    const caso = new EliminarCircular({ circularRepository: repo });
    let error = null;
    try { await caso.ejecutar(null); } catch (e) { error = e; }
    check('retirar sin id → ValidationError', error instanceof ValidationError && repo.llamadas.eliminar.length === 0);
    const texto = await caso.ejecutar(9);
    check('retirar llama al servidor y lo dice', texto === 'Circular retirada.' && repo.llamadas.eliminar.join() === '9');
}

{
    const repo = repoFalso();
    const caso = new MarcarCircularLeida({ circularRepository: repo });
    check('una familia que no la había leído: se anota', await caso.ejecutar(a) === true && repo.llamadas.marcar.join() === '9');
    check('si ya la había leído no se vuelve a llamar',
        await caso.ejecutar(new Circular({ id: 5, titulo: 'x', leida: true })) === false && repo.llamadas.marcar.length === 1);
    check('si no es familia (leida null) no se llama', await caso.ejecutar(b) === false && repo.llamadas.marcar.length === 1);

    const roto = { async marcarLeida() { throw new Error('sin red'); } };
    const errorOriginal = console.error;
    console.error = () => {};
    const r = await new MarcarCircularLeida({ circularRepository: roto }).ejecutar(a);
    console.error = errorOriginal;
    check('si falla no interrumpe la lectura', r === false);
}

console.log('\n── El aviso de novedades ──');

const aviso = new Novedad({ tipo: 'circular', clave: 'circular:9', titulo: 'Nueva circular del jardín', texto: 'Reunión', referenciaId: 9 });
check('un aviso de circular lleva a Circulares', aviso.rutaDestino() === 'circulares');
check('con su icono', aviso.icono() === 'campaign');
check('los tipos de siempre no cambian de icono',
    new Novedad({ tipo: 'mensaje' }).icono() === 'mail' && new Novedad({ tipo: 'agenda' }).icono() === 'event_note'
    && new Novedad({ tipo: 'observacion' }).icono() === 'sticky_note_2');
check('un tipo desconocido no revienta', new Novedad({ tipo: 'otro' }).rutaDestino() === 'menu'
    && new Novedad({ tipo: 'otro' }).icono() === 'notifications');

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
