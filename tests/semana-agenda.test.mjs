/**
 * semana-agenda.test.mjs — Histórico semanal de la agenda diaria (BL-57).
 *
 * Se ejecuta con:  node tests/semana-agenda.test.mjs
 *
 * Lo que se fija: que la semana empiece en lunes y acabe en domingo **igual que
 * en Android**, que los días sin agenda salgan como huecos en vez de
 * esconderse, y que el cambio de zona horaria no mueva la semana — que es el
 * fallo clásico de calcular fechas con el reloj del navegador.
 */
import { rangoDeLaSemana, diasDeLaSemana, nombreDelDia, semanaConHuecos, resumenDelDia, AgendaDiaria }
    from '../src/domain/entities/AgendaDiaria.js';
import { aSemanaDeAgenda } from '../src/data/dto/mappers.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── La semana va de lunes a domingo ──');

// El 16 de septiembre de 2026 es miércoles.
check('desde un miércoles', JSON.stringify(rangoDeLaSemana('2026-09-16'))
    === JSON.stringify({ desde: '2026-09-14', hasta: '2026-09-20' }),
    JSON.stringify(rangoDeLaSemana('2026-09-16')));
check('desde el lunes, la misma semana', JSON.stringify(rangoDeLaSemana('2026-09-14'))
    === JSON.stringify({ desde: '2026-09-14', hasta: '2026-09-20' }));
check('desde el domingo, TAMBIÉN la misma: el domingo cierra, no abre',
    JSON.stringify(rangoDeLaSemana('2026-09-20'))
    === JSON.stringify({ desde: '2026-09-14', hasta: '2026-09-20' }),
    JSON.stringify(rangoDeLaSemana('2026-09-20')));
check('el lunes siguiente ya es otra semana',
    rangoDeLaSemana('2026-09-21').desde === '2026-09-21');

console.log('\n── Los saltos de mes y de año ──');

check('una semana a caballo entre dos meses',
    JSON.stringify(rangoDeLaSemana('2026-10-01'))
    === JSON.stringify({ desde: '2026-09-28', hasta: '2026-10-04' }),
    JSON.stringify(rangoDeLaSemana('2026-10-01')));
check('y entre dos años',
    JSON.stringify(rangoDeLaSemana('2027-01-01'))
    === JSON.stringify({ desde: '2026-12-28', hasta: '2027-01-03' }),
    JSON.stringify(rangoDeLaSemana('2027-01-01')));
check('el 29 de febrero de un bisiesto no descoloca nada',
    rangoDeLaSemana('2028-02-29').desde === '2028-02-28',
    JSON.stringify(rangoDeLaSemana('2028-02-29')));

console.log('\n── Los siete días ──');

const dias = diasDeLaSemana('2026-09-16');
check('son siete', dias.length === 7);
check('empiezan en lunes y acaban en domingo',
    dias[0] === '2026-09-14' && dias[6] === '2026-09-20', JSON.stringify(dias));
check('sin huecos ni repetidos', new Set(dias).size === 7);

check('el nombre del lunes', nombreDelDia('2026-09-14') === 'Lunes');
check('el del miércoles', nombreDelDia('2026-09-16') === 'Miércoles');
check('y el del domingo', nombreDelDia('2026-09-20') === 'Domingo');

console.log('\n── Los días sin agenda son huecos, no desaparecen ──');

const agendas = [
    new AgendaDiaria({ estudianteId: 100, fecha: '2026-09-14', alimentacionAlmuerzo: 'Comió todo', estadoAnimo: ['Alegre'] }),
    new AgendaDiaria({ estudianteId: 100, fecha: '2026-09-16', alimentacionAlmuerzo: 'Comió un poco', estadoAnimo: [] }),
];

const semana = semanaConHuecos('2026-09-16', agendas);
check('la semana tiene siempre siete entradas', semana.length === 7, String(semana.length));
check('el lunes trae su agenda', semana[0].agenda !== null && semana[0].fecha === '2026-09-14');
check('el martes es un hueco', semana[1].agenda === null && semana[1].fecha === '2026-09-15');
check('el miércoles trae la suya', semana[2].agenda !== null);
check('y el resto son huecos', semana.slice(3).every(d => d.agenda === null));
check('cada entrada sabe cómo se llama su día', semana[0].nombre === 'Lunes' && semana[6].nombre === 'Domingo');

console.log('\n── El resumen de una línea ──');

check('sin agenda lo dice', resumenDelDia(null) === 'Sin agenda');
check('con ánimo y almuerzo, los junta',
    resumenDelDia(agendas[0]) === 'Alegre · Almuerzo: Comió todo', resumenDelDia(agendas[0]));
check('sin ánimo, sólo el almuerzo',
    resumenDelDia(agendas[1]) === 'Almuerzo: Comió un poco', resumenDelDia(agendas[1]));
check('una agenda registrada pero vacía no miente',
    resumenDelDia(new AgendaDiaria({ estudianteId: 1, fecha: '2026-09-15', estadoAnimo: [] }))
    === 'Registrada, sin detalles');

console.log('\n── El mapeo de la respuesta del rango ──');

const RESPUESTA = {
    success: true,
    desde: '2026-09-14',
    hasta: '2026-09-20',
    dias: [
        { estudiante_id: 100, fecha: '2026-09-14', alimentacion_almuerzo: 'Comió todo', estado_animo: ['Alegre', 'Activo'], comentarios_del_dia: 'Buen lunes' },
        { estudiante_id: 100, fecha: '2026-09-16', alimentacion_almuerzo: 'Comió un poco', estado_animo: [], comentarios_del_dia: null },
    ],
};

const mapeadas = aSemanaDeAgenda(RESPUESTA);
check('salen las dos agendas', mapeadas.length === 2);
check('con sus fechas', mapeadas[0].fecha === '2026-09-14');
check('el estado de ánimo llega como lista',
    JSON.stringify(mapeadas[0].estadoAnimo) === JSON.stringify(['Alegre', 'Activo']),
    JSON.stringify(mapeadas[0].estadoAnimo));
check('y el vacío como lista vacía', mapeadas[1].estadoAnimo.length === 0);
check('una semana sin nada es una lista vacía, no un fallo',
    aSemanaDeAgenda({ success: true, desde: 'x', hasta: 'y', dias: [] }).length === 0);
check('una respuesta rota tampoco revienta', aSemanaDeAgenda(null).length === 0);

console.log('\n── La zona horaria no mueve la semana ──');

// El fallo clásico: calcular con hora local y que un lunes a las 00:00 en un
// huso negativo caiga en el domingo anterior. Por eso se usa Date.UTC.
const antes = process.env.TZ;
let coinciden = true;
for (const zona of ['UTC', 'America/Bogota', 'Asia/Tokyo', 'Europe/Madrid', 'Pacific/Kiritimati']) {
    process.env.TZ = zona;
    if (JSON.stringify(rangoDeLaSemana('2026-09-14')) !== JSON.stringify({ desde: '2026-09-14', hasta: '2026-09-20' })) {
        coinciden = false;
        console.log(`     (falla en ${zona}: ${JSON.stringify(rangoDeLaSemana('2026-09-14'))})`);
    }
}
process.env.TZ = antes;
check('la semana del 14 es la misma en cualquier huso horario', coinciden);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
