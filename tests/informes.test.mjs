/**
 * informes.test.mjs — Informe de asistencia del director (BL-55).
 *
 * Se ejecuta con:  node tests/informes.test.mjs
 *
 * Lo que se fija: que el mapeo respete el null de "sin datos" —que NO es un 0%—
 * y que las reglas de lectura del porcentaje sean exactamente las mismas que en
 * Android, porque el mismo informe se ve en las dos aplicaciones.
 */
import { aInformeAsistencia } from '../src/data/dto/mappers.js';
import { textoPorcentaje, nivelDeAsistencia, textoDelPeriodo, InformeAsistencia, FilaAlumnoInforme,
         csvDelInforme, nombreDeArchivoCsv, campoCsv, numeroCsv, BOM_UTF8 }
    from '../src/domain/entities/InformeAsistencia.js';
import { esFuturo, mesAnterior, mesSiguiente } from '../src/domain/usecases/ObtenerInformeAsistencia.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

// Lo que devuelve informe_asistencia.php, tal cual.
const RESPUESTA = {
    success: true,
    periodo: { anio: 2026, mes: 9, desde: '2026-09-01', hasta: '2026-09-30' },
    grupo: { id: 1, nombre_grupo: 'Rojo' },
    totales: { asistio: 3, tarde: 1, ausente: 3, registros: 7, dias_con_registro: 5, porcentaje_asistencia: 57.1 },
    total_alumnos: 3,
    alumnos: [
        { estudiante_id: 100, nombres: 'Ana',   apellidos: 'Alvarez',  asistio: 3, tarde: 1, ausente: 1, registros: 5, porcentaje_asistencia: 80 },
        { estudiante_id: 101, nombres: 'Bruno', apellidos: 'Bermudez', asistio: 0, tarde: 0, ausente: 2, registros: 2, porcentaje_asistencia: 0 },
        { estudiante_id: 102, nombres: 'Cielo', apellidos: 'Cardenas', asistio: 0, tarde: 0, ausente: 0, registros: 0, porcentaje_asistencia: null },
    ],
};

console.log('\n── El mapeo del informe ──');

const informe = aInformeAsistencia(RESPUESTA);
check('es un InformeAsistencia', informe instanceof InformeAsistencia);
check('recoge el periodo', informe.periodo.anio === 2026 && informe.periodo.mes === 9);
check('recoge el grupo con el nombre traducido', informe.grupo?.nombreGrupo === 'Rojo');
check('recoge los tres alumnos', informe.alumnos.length === 3);
check('cada alumno es una FilaAlumnoInforme', informe.alumnos[0] instanceof FilaAlumnoInforme);
check('traduce dias_con_registro', informe.totales.diasConRegistro === 5);
check('el nombre completo se compone', informe.alumnos[0].nombreCompleto === 'Ana Alvarez');

console.log('\n── "Sin datos" no es 0% ──');

const cielo = informe.alumnos[2];
check('el porcentaje null sigue siendo null', cielo.porcentajeAsistencia === null);
check('y el alumno se marca como sin registros', cielo.sinRegistros === true);
check('un 0% real NO es sin registros', informe.alumnos[1].sinRegistros === false);
check('0 y null no se confunden', informe.alumnos[1].porcentajeAsistencia === 0);

console.log('\n── Sin grupo, el colegio entero ──');

const todoElColegio = aInformeAsistencia({ ...RESPUESTA, grupo: null });
check('el grupo queda a null', todoElColegio.grupo === null);
check('y se llama "Todo el colegio"', todoElColegio.nombreDelAmbito === 'Todo el colegio');
check('con grupo, se llama por su nombre', informe.nombreDelAmbito === 'Rojo');

console.log('\n── Cómo se escribe un porcentaje ──');

check('80 se escribe 80%', textoPorcentaje(80) === '80%');
check('79.5 se escribe 79.5%', textoPorcentaje(79.5) === '79.5%');
check('0 se escribe 0%, no "Sin datos"', textoPorcentaje(0) === '0%');
check('null se escribe "Sin datos"', textoPorcentaje(null) === 'Sin datos');
check('undefined también', textoPorcentaje(undefined) === 'Sin datos');

console.log('\n── Los niveles que colorean la fila ──');

check('100% es bien',   nivelDeAsistencia(100) === 'bien');
check('90% es bien',    nivelDeAsistencia(90) === 'bien');
check('89.9% es regular', nivelDeAsistencia(89.9) === 'regular');
check('80% es regular', nivelDeAsistencia(80) === 'regular');
check('79.9% es bajo',  nivelDeAsistencia(79.9) === 'bajo');
check('0% es bajo',     nivelDeAsistencia(0) === 'bajo');
check('null es sin-datos', nivelDeAsistencia(null) === 'sin-datos');

console.log('\n── El orden: quien más falta, primero ──');

const ordenados = informe.porAusencias();
check('el que más faltó va arriba', ordenados[0].estudianteId === 101, String(ordenados[0].estudianteId));
check('y no se pierde nadie', ordenados.length === 3);
check('el informe original no se toca', informe.alumnos[0].estudianteId === 100);

console.log('\n── El periodo y los meses ──');

check('el texto del periodo', textoDelPeriodo(2026, 9) === 'Septiembre de 2026');
check('diciembre también', textoDelPeriodo(2026, 12) === 'Diciembre de 2026');
check('mes anterior a enero es diciembre del año pasado',
    JSON.stringify(mesAnterior({ anio: 2026, mes: 1 })) === JSON.stringify({ anio: 2025, mes: 12 }));
check('mes siguiente a diciembre es enero del año que viene',
    JSON.stringify(mesSiguiente({ anio: 2026, mes: 12 })) === JSON.stringify({ anio: 2027, mes: 1 }));

const hoy = new Date(2026, 8, 16);   // septiembre de 2026
check('el mes en curso no es futuro', esFuturo({ anio: 2026, mes: 9 }, hoy) === false);
check('el que viene sí lo es',       esFuturo({ anio: 2026, mes: 10 }, hoy) === true);
check('el año que viene también',    esFuturo({ anio: 2027, mes: 1 }, hoy) === true);
check('un mes pasado no',            esFuturo({ anio: 2026, mes: 8 }, hoy) === false);

console.log('\n── Una respuesta rota no tumba la pantalla ──');

const vacio = aInformeAsistencia(null);
check('sin JSON, un informe vacío', vacio.alumnos.length === 0 && vacio.estaVacio === true);
check('y sin registros', vacio.sinRegistros === true);

console.log('\n── Exportar a CSV (BL-56) ──');

/**
 * ESTE MISMO TEXTO está fijado en InformeAsistenciaTest.kt, carácter por
 * carácter. Es el informe exportado desde las dos aplicaciones: si alguien
 * cambia una columna en un lado, la prueba del otro lo dice.
 */
const CSV_ESPERADO =
    'Informe de asistencia\r\n' +
    'Ambito;Rojo\r\n' +
    'Periodo;Septiembre de 2026\r\n' +
    'Dias con asistencia tomada;5\r\n' +
    '\r\n' +
    'Apellidos;Nombres;Asistio;Tarde;Ausente;Registros;% Asistencia\r\n' +
    'Bermudez;Bruno;0;0;2;2;0\r\n' +
    'Alvarez;Ana;3;1;1;5;80\r\n' +
    'Cardenas;Cielo;0;0;0;0;\r\n' +
    '\r\n' +
    'TOTAL;;3;1;3;7;57,1';

check('el CSV sale exactamente como se espera', csvDelInforme(informe) === CSV_ESPERADO,
    JSON.stringify(csvDelInforme(informe)));
check('el que más falta va primero, igual que en pantalla',
    csvDelInforme(informe).includes('Bermudez;Bruno'));
check('"sin datos" se deja en blanco, no en 0',
    csvDelInforme(informe).includes('Cardenas;Cielo;0;0;0;0;'));
check('los decimales van con coma, que es lo que espera un Excel en español',
    csvDelInforme(informe).includes('57,1'));
check('las líneas acaban en CRLF', csvDelInforme(informe).includes('\r\n'));

console.log('\n── El escapado de un campo ──');

check('un texto normal va tal cual', campoCsv('Alvarez') === 'Alvarez');
check('uno con punto y coma se entrecomilla', campoCsv('Pe;ña') === '"Pe;ña"');
check('las comillas de dentro se duplican', campoCsv('Ana "la mayor"') === '"Ana ""la mayor"""');
check('un salto de línea también se entrecomilla', campoCsv('a\nb') === '"a\nb"');
check('null es cadena vacía', campoCsv(null) === '');
check('el 0 se escribe, no se calla', campoCsv(0) === '0');

check('un número redondo no lleva decimales', numeroCsv(80) === '80');
check('uno partido lleva coma', numeroCsv(79.5) === '79,5');
check('null es cadena vacía', numeroCsv(null) === '');
check('el 0 se escribe', numeroCsv(0) === '0');

console.log('\n── El nombre del archivo ──');

check('lleva año, mes y grupo', nombreDeArchivoCsv(informe) === 'asistencia-2026-09-Rojo.csv',
    nombreDeArchivoCsv(informe));
check('sin grupo, dice colegio',
    nombreDeArchivoCsv(aInformeAsistencia({ ...RESPUESTA, grupo: null })) === 'asistencia-2026-09-colegio.csv');
check('las tildes y los espacios se van',
    nombreDeArchivoCsv(aInformeAsistencia({ ...RESPUESTA, grupo: { id: 2, nombre_grupo: 'Azul Añil / 2' } }))
        === 'asistencia-2026-09-Azul-Anil-2.csv',
    nombreDeArchivoCsv(aInformeAsistencia({ ...RESPUESTA, grupo: { id: 2, nombre_grupo: 'Azul Añil / 2' } })));
check('el mes va con dos dígitos',
    nombreDeArchivoCsv(aInformeAsistencia({ ...RESPUESTA, periodo: { anio: 2026, mes: 1 } }))
        === 'asistencia-2026-01-Rojo.csv');

check('el BOM es el carácter de marca de orden, no texto',
    BOM_UTF8 === '\uFEFF' && BOM_UTF8.length === 1);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
