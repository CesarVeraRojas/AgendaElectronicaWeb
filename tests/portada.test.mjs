/**
 * portada.test.mjs — Las cifras del colegio (BL-58).
 *
 * Se ejecuta con:  node tests/portada.test.mjs
 *
 * Espejo de `PortadaColegioTest.kt`. Lo que se fija son **las palabras**: la
 * portada dice lo mismo en el móvil y en la web, y el caso que importa —que
 * falten niños por pasar lista— tiene que decirse con número, no con un adorno.
 */
import { aResumenColegio } from '../src/data/dto/mappers.js';
import { textoAsistenciaHoy, ResumenColegio, AsistenciaDeHoy } from '../src/domain/entities/ResumenColegio.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

const RESPUESTA = {
    success: true,
    colegio_id: 1,
    totales: { estudiantes: 4, grupos: 2, profesionales: 2, acudientes: 3 },
    asistencia_hoy: { fecha: '2026-09-16', asistio: 1, tarde: 1, ausente: 1, registros: 3, sin_registrar: 1 },
};

console.log('\n── El mapeo ──');

const resumen = aResumenColegio(RESPUESTA);
check('es un ResumenColegio', resumen instanceof ResumenColegio);
check('recoge las cuatro cifras',
    resumen.estudiantes === 4 && resumen.grupos === 2 && resumen.profesionales === 2 && resumen.acudientes === 3,
    JSON.stringify(resumen));
check('y la asistencia de hoy', resumen.asistenciaHoy instanceof AsistenciaDeHoy);
check('traduce sin_registrar', resumen.asistenciaHoy.sinRegistrar === 1);
check('con su fecha', resumen.asistenciaHoy.fecha === '2026-09-16');
check('una respuesta rota no revienta', aResumenColegio(null).estudiantes === 0);
check('y se reconoce como vacía', aResumenColegio(null).estaVacio === true);

console.log('\n── Los tres estados de la asistencia de hoy ──');

const sinEmpezar = new AsistenciaDeHoy({ registros: 0, sinRegistrar: 4 });
const aMedias    = new AsistenciaDeHoy({ registros: 3, sinRegistrar: 1 });
const completa   = new AsistenciaDeHoy({ registros: 4, sinRegistrar: 0 });

check('sin empezar se reconoce', sinEmpezar.sinEmpezar === true && sinEmpezar.aMedias === false);
check('a medias se reconoce',    aMedias.aMedias === true && aMedias.sinEmpezar === false);
check('completa no es ninguna',  completa.aMedias === false && completa.sinEmpezar === false);

console.log('\n── Lo que dice la portada ──');

check('sin empezar',
    textoAsistenciaHoy(sinEmpezar, 4) === 'Hoy todavía no se ha tomado asistencia.',
    textoAsistenciaHoy(sinEmpezar, 4));
check('a medias, CON el número',
    textoAsistenciaHoy(aMedias, 4) === 'Faltan 1 alumno por pasar lista.',
    textoAsistenciaHoy(aMedias, 4));
check('a medias en plural',
    textoAsistenciaHoy(new AsistenciaDeHoy({ registros: 1, sinRegistrar: 3 }), 4)
        === 'Faltan 3 alumnos por pasar lista.');
check('completa', textoAsistenciaHoy(completa, 4) === 'Asistencia tomada a todos los alumnos.');
check('un colegio sin alumnos no dice que falte nadie',
    textoAsistenciaHoy(sinEmpezar, 0) === 'Aún no hay alumnos registrados.',
    textoAsistenciaHoy(sinEmpezar, 0));
check('sin datos de asistencia tampoco',
    textoAsistenciaHoy(null, 4) === 'Aún no hay alumnos registrados.');

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
