/**
 * fotos-colegio.test.mjs — La galería del director (BL-60 y BL-61).
 *
 * Se ejecuta con:  node tests/fotos-colegio.test.mjs
 *
 * Espejo de `FotosDelColegioTest.kt`: los textos esperados son LOS MISMOS,
 * carácter por carácter, para que la galería diga lo mismo en el móvil y en la
 * web. Si se cambia una palabra aquí, hay que cambiarla allí.
 */
import { aPaginaDeFotos } from '../src/data/dto/mappers.js';
import { FotoDelColegio, PaginaDeFotos, agruparPorDia, juntarPaginas, sinFoto,
         textoDelDia, textoSubidoPor, textoSinFotos, TEXTO_CONFIRMAR_ELIMINAR } from '../src/domain/entities/FotoDelColegio.js';
import { EliminarFoto } from '../src/domain/usecases/EliminarFoto.js';
import { ObtenerFotosDelColegio } from '../src/domain/usecases/ObtenerFotosDelColegio.js';
import { ValidationError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

const RESPUESTA = {
    success: true,
    hoy: '2026-09-28',
    hay_mas: true,
    siguiente: 3,
    fotos: [
        { id: 4, foto_url: 'https://x/uploads/fotos_estudiantes/d.jpg', fecha_subida: '2026-09-27 21:30:00', dia: '2026-09-27',
          estudiante_id: 100, estudiante_nombre: 'Ana Alvarez', grupos: ['Azul', 'Rojo'],
          subido_por: { tipo: 'profesional', nombre: 'Ana Gil' } },
        { id: 3, foto_url: 'https://x/uploads/fotos_estudiantes/c.jpg', fecha_subida: '2026-09-27 10:00:00', dia: '2026-09-27',
          estudiante_id: 102, estudiante_nombre: 'Cielo Cardenas', grupos: [], subido_por: null },
    ],
};

console.log('\n── El mapeo ──');

const pagina = aPaginaDeFotos(RESPUESTA);
check('es una PaginaDeFotos', pagina instanceof PaginaDeFotos);
check('con sus fotos', pagina.fotos.length === 2 && pagina.fotos[0] instanceof FotoDelColegio);
check('traduce hay_mas y siguiente', pagina.hayMas === true && pagina.siguiente === 3);
check('y el hoy del servidor', pagina.hoy === '2026-09-28');
const f = pagina.fotos[0];
check('los campos de la foto', f.id === 4 && f.estudianteId === 100 && f.estudianteNombre === 'Ana Alvarez'
    && f.dia === '2026-09-27' && f.fotoUrl.endsWith('/d.jpg'), JSON.stringify(f));
check('sus grupos', JSON.stringify(f.grupos) === '["Azul","Rojo"]');
check('quién la subió', f.subidoPor?.tipo === 'profesional' && f.subidoPor?.nombre === 'Ana Gil');
check('sin autor se queda en null, no se inventa', pagina.fotos[1].subidoPor === null);
check('la hora sale de la fecha', f.hora === '21:30', f.hora);
check('una respuesta rota no revienta', aPaginaDeFotos(null).fotos.length === 0 && aPaginaDeFotos(null).hayMas === false);
check('sin "dia" se toma de la fecha', aPaginaDeFotos({ fotos: [{ id: 1, fecha_subida: '2026-01-02 08:00:00' }] }).fotos[0].dia === '2026-01-02');

console.log('\n── Cómo se titula cada día ──');

check('hoy',  textoDelDia('2026-09-28', '2026-09-28') === 'Hoy');
check('ayer', textoDelDia('2026-09-27', '2026-09-28') === 'Ayer');
check('antes de ayer, con el día de la semana',
    textoDelDia('2026-09-26', '2026-09-28') === 'Sábado 26 de septiembre', textoDelDia('2026-09-26', '2026-09-28'));
check('ayer aunque cambie el mes',  textoDelDia('2026-09-30', '2026-10-01') === 'Ayer');
check('ayer aunque cambie el año',  textoDelDia('2025-12-31', '2026-01-01') === 'Ayer');
check('otro año lleva el año',
    textoDelDia('2025-12-30', '2026-01-01') === 'Martes 30 de diciembre de 2025', textoDelDia('2025-12-30', '2026-01-01'));
check('miércoles con tilde', textoDelDia('2026-09-23', '2026-09-28') === 'Miércoles 23 de septiembre');
check('sin "hoy" no dice Hoy ni Ayer, dice la fecha',
    textoDelDia('2026-09-28', null) === 'Lunes 28 de septiembre', textoDelDia('2026-09-28', null));
check('un día mal formado se devuelve tal cual', textoDelDia('ayer', '2026-09-28') === 'ayer');

// En la web el cálculo va con Date.UTC: un huso negativo no puede mover el día.
const TZ = process.env.TZ;
for (const zona of ['America/Bogota', 'Pacific/Honolulu', 'Asia/Tokyo', 'UTC']) {
    process.env.TZ = zona;
    check(`en ${zona} el lunes sigue siendo lunes`, textoDelDia('2026-09-21', '2026-09-28') === 'Lunes 21 de septiembre');
}
process.env.TZ = TZ;

console.log('\n── Agrupar por día ──');

const foto = (id, dia) => new FotoDelColegio({ id, dia, fotoUrl: '', estudianteNombre: '' });
const grupos = agruparPorDia([foto(5, '2026-09-28'), foto(4, '2026-09-27'), foto(3, '2026-09-27'), foto(1, '2026-09-20')]);
check('tres días', grupos.length === 3, JSON.stringify(grupos.map(g => g.dia)));
check('en el orden en que llegan', grupos.map(g => g.dia).join() === '2026-09-28,2026-09-27,2026-09-20');
check('las dos del 27 juntas y en orden', grupos[1].fotos.map(x => x.id).join() === '4,3');
check('sin fotos, sin grupos', agruparPorDia([]).length === 0);

console.log('\n── Páginas y borrado ──');

const primera = [foto(5, 'a'), foto(4, 'a')];
check('la página siguiente se añade detrás', juntarPaginas(primera, [foto(3, 'a')]).map(x => x.id).join() === '5,4,3');
check('sin repetir una foto que ya estaba', juntarPaginas(primera, [foto(4, 'a'), foto(3, 'a')]).map(x => x.id).join() === '5,4,3');
check('borrar quita sólo esa', sinFoto(primera, 5).map(x => x.id).join() === '4');
check('y no toca la lista original', primera.length === 2);

console.log('\n── Las palabras ──');

check('subida por un profesional', textoSubidoPor({ tipo: 'profesional', nombre: 'Ana Gil' }) === 'Subida por Ana Gil');
check('subida por la dirección', textoSubidoPor({ tipo: 'director', nombre: 'Carlos Vera' }) === 'Subida por Carlos Vera (dirección)');
check('sin registro', textoSubidoPor(null) === 'Sin registro de quién la subió');
check('colegio sin fotos', textoSinFotos({}) === 'Todavía no se ha subido ninguna foto en el colegio.');
check('grupo sin fotos', textoSinFotos({ grupoId: 2 }) === 'Todavía no hay fotos de este grupo.');
check('estudiante sin fotos, aunque haya grupo', textoSinFotos({ grupoId: 2, estudianteId: 9 }) === 'Este estudiante todavía no tiene fotos.');
check('el aviso antes de borrar', TEXTO_CONFIRMAR_ELIMINAR === 'Las familias dejarán de verla. Esta acción no se puede deshacer.');

console.log('\n── Casos de uso ──');

const llamadas = [];
const repoFotos = {
    async listarDelColegio(filtro) { llamadas.push(['listar', filtro]); return new PaginaDeFotos({}); },
    async eliminar(id)             { llamadas.push(['eliminar', id]); },
};
const repoEst = {
    async listar()           { llamadas.push(['todos']); return [{ id: 2, nombreCompleto: 'Zoe Ruiz' }, { id: 1, nombreCompleto: 'Álvaro Paz' }]; },
    async listarPorGrupo(g)  { llamadas.push(['grupo', g]); return [{ id: 3, nombreCompleto: 'Bruno' }]; },
};
const obtener = new ObtenerFotosDelColegio({ fotoRepository: repoFotos, grupoRepository: {}, estudianteRepository: repoEst });

await obtener.ejecutar({ grupoId: 1 });
check('pide con el filtro y sin página', JSON.stringify(llamadas.at(-1)) === '["listar",{"grupoId":1,"estudianteId":null,"antesDe":null}]',
    JSON.stringify(llamadas.at(-1)));
const todos = await obtener.estudiantes(null);
check('sin grupo, los estudiantes de todo el colegio', llamadas.at(-1)[0] === 'todos');
check('ordenados por nombre, y la tilde no manda al final', todos.map(e => e.id).join() === '1,2', JSON.stringify(todos));
await obtener.estudiantes(7);
check('con grupo, los de ese grupo', JSON.stringify(llamadas.at(-1)) === '["grupo",7]');

const eliminar = new EliminarFoto({ fotoRepository: repoFotos });
check('eliminar confirma con un texto', await eliminar.ejecutar(9) === 'Foto eliminada.' && JSON.stringify(llamadas.at(-1)) === '["eliminar",9]');
let lanzo = false;
try { await eliminar.ejecutar(null); } catch (e) { lanzo = e instanceof ValidationError; }
check('sin foto no llama al servidor', lanzo && llamadas.at(-1)[1] === 9);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
