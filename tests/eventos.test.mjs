/**
 * eventos.test.mjs — El calendario de eventos (BL-76).
 *
 * Se ejecuta con:  node tests/eventos.test.mjs
 *
 * Espejo de `EventosTest.kt`: los textos esperados son LOS MISMOS, carácter por
 * carácter. Si se cambia una palabra aquí, hay que cambiarla allí.
 */
import { aCalendarioDeEventos, aEvento } from '../src/data/dto/mappers.js';
import { Evento, NuevoEvento, horaLegible, diaLegible, textoFechaEvento, textoParaQuien, agruparPorMes,
         proximoEvento, semanasDelMes, tituloDelMes, textoSinEventos, validarEvento, generarIcs, colorDeEvento,
         TEXTO_CONFIRMAR_CANCELAR_EVENTO } from '../src/domain/entities/Evento.js';
import { AdministrarEventos } from '../src/domain/usecases/AdministrarEventos.js';
import { ObtenerMenuPorRol } from '../src/domain/usecases/ObtenerMenuPorRol.js';
import { Novedad } from '../src/domain/entities/Novedad.js';
import { Sesion, Rol } from '../src/domain/entities/Sesion.js';
import { ValidationError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { ok++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${x}`); } };
const eq = (n, real, esperado) => check(n, real === esperado, `→ "${real}" (esperado "${esperado}")`);

const HOY = '2026-09-30';   // miércoles
const ev = (o) => new Evento({ id: 1, tipo: 'reunion', tipoNombre: 'Reunión de padres', color: 'azul', titulo: 'Reunión',
                               fechaInicio: '2026-10-02', ...o });

console.log('\n── El mapeo ──');
const cal = aCalendarioDeEventos({ success: true, hoy: HOY, puede_crear: true,
    tipos: [{ clave: 'reunion', nombre: 'Reunión de padres', color: 'azul' }],
    grupos_para_crear: [{ id: '1', nombre: 'Rojo' }],
    eventos: [{ id: '7', tipo: 'salida', tipo_nombre: 'Salida pedagógica', color: 'verde', titulo: 'Parque', descripcion: null,
                lugar: null, fecha_inicio: '2026-10-01', fecha_fin: '2026-10-01', hora_inicio: '09:00', hora_fin: null,
                todo_el_dia: false, grupo_id: '1', grupo_nombre: 'Rojo', autor: 'Marta Rios', puede_editar: true }] });
check('trae hoy, tipos y grupos', cal.hoy === HOY && cal.tipos[0].clave === 'reunion' && cal.gruposParaCrear[0].id === 1 && cal.puedeCrear);
const p = cal.eventos[0];
check('el evento, con números como números', p instanceof Evento && p.id === 7 && p.grupoId === 1 && p.descripcion === '');
check('con hora no es de todo el día', p.todoElDia === false && p.variosDias === false);
check('una respuesta rota no revienta', aCalendarioDeEventos(null).eventos.length === 0 && aCalendarioDeEventos(null).puedeCrear === false);
check('sin fecha de fin, la de inicio', aEvento({ id: 1, fecha_inicio: '2026-10-02' }).fechaFin === '2026-10-02');

console.log('\n── Cómo se dice cuándo (mismos textos que Android) ──');
eq('hora de la tarde', horaLegible('18:30'), '6:30 p. m.');
eq('mediodía', horaLegible('12:00'), '12:00 p. m.');
eq('medianoche', horaLegible('00:15'), '12:15 a. m.');
eq('hoy', diaLegible('2026-09-30', HOY), 'Hoy');
eq('mañana', diaLegible('2026-10-01', HOY), 'Mañana');
eq('otro día', diaLegible('2026-10-02', HOY), 'Viernes 2 de octubre');
eq('otro año', diaLegible('2027-01-04', HOY), 'Lunes 4 de enero de 2027');
eq('con hora de inicio y fin', textoFechaEvento(ev({ horaInicio: '18:00', horaFin: '20:00' }), HOY), 'Viernes 2 de octubre · 6:00 p. m. – 8:00 p. m.');
eq('sólo con hora de inicio', textoFechaEvento(ev({ fechaInicio: '2026-10-01', horaInicio: '09:00' }), HOY), 'Mañana · 9:00 a. m.');
eq('todo el día', textoFechaEvento(ev({ fechaInicio: HOY }), HOY), 'Hoy · Todo el día');
eq('varios días del mismo mes', textoFechaEvento(ev({ fechaInicio: '2026-10-05', fechaFin: '2026-10-09' }), HOY), 'Del lunes 5 al viernes 9 de octubre');
eq('varios días entre meses', textoFechaEvento(ev({ fechaInicio: '2026-12-21', fechaFin: '2027-01-08' }), HOY), 'Del lunes 21 de diciembre al viernes 8 de enero');
eq('para todo el jardín', textoParaQuien(ev({})), 'Todo el jardín');
eq('para un grupo', textoParaQuien(ev({ grupoNombre: 'Rojo' })), 'Grupo Rojo');
eq('sin eventos, quien puede crear', textoSinEventos(true), 'No hay eventos próximos. Toque "Nuevo evento" para crear el primero.');
eq('sin eventos, la familia', textoSinEventos(false), 'No hay eventos próximos en el calendario del jardín.');
eq('el aviso antes de cancelar', TEXTO_CONFIRMAR_CANCELAR_EVENTO, 'Las familias recibirán un aviso de que el evento se canceló y dejará de verse en el calendario.');
eq('color de la paleta', colorDeEvento('verde'), '#43A047');
eq('color desconocido, gris', colorDeEvento('fucsia'), '#757575');

console.log('\n── Listas y el mes ──');
const lista = [ev({ id: 1, fechaInicio: '2026-09-30' }), ev({ id: 2, fechaInicio: '2026-10-15' }), ev({ id: 3, fechaInicio: '2026-11-02' })];
const grupos = agruparPorMes(lista);
check('próximos agrupados por mes, en orden', grupos.map(g => g.mes).join('|') === 'Septiembre de 2026|Octubre de 2026|Noviembre de 2026'
    && grupos[1].eventos[0].id === 2, JSON.stringify(grupos.map(g => g.mes)));
check('el próximo es el primero que no ha terminado', proximoEvento([ev({ id: 9, fechaInicio: '2026-09-20', fechaFin: '2026-09-29' }), ...lista], HOY).id === 1);
check('uno de varios días que sigue en curso cuenta', proximoEvento([ev({ id: 9, fechaInicio: '2026-09-28', fechaFin: '2026-10-02' })], HOY).id === 9);
check('sin eventos, null', proximoEvento([], HOY) === null);
eq('título del mes', tituloDelMes(2026, 10), 'Octubre de 2026');
const oct = semanasDelMes(2026, 10, [ev({ id: 5, fechaInicio: '2026-10-05', fechaFin: '2026-10-07' })], HOY);
check('octubre de 2026: 5 semanas, del lunes 28 de sept. al domingo 1 de nov.', oct.length === 5
    && oct[0][0].fecha === '2026-09-28' && oct[4][6].fecha === '2026-11-01', `${oct.length} ${oct[0][0].fecha} ${oct.at(-1)[6].fecha}`);
check('los días de otro mes se marcan', oct[0][0].delMes === false && oct[0][3].delMes === true);
check('hoy se marca', oct[0][2].esHoy === true);
check('un evento de tres días aparece en los tres', [oct[1][0], oct[1][1], oct[1][2]].every(d => d.eventos.length === 1) && oct[1][3].eventos.length === 0);
check('febrero de 2027 empieza en lunes y cabe en 4 semanas', semanasDelMes(2027, 2, [], HOY).length === 4);

console.log('\n── Lo que se exige (mismas palabras que el servidor) ──');
const bien = () => new NuevoEvento({ tipo: 'reunion', titulo: 'Reunión', fechaInicio: '2026-10-02', horaInicio: '18:00', horaFin: '20:00' });
const con = (o, esProf = false) => validarEvento(Object.assign(bien(), o), HOY, esProf);
check('bien: sin error', validarEvento(bien(), HOY) === null);
eq('sin título', con({ titulo: ' ' }), 'El título es obligatorio.');
eq('título largo', con({ titulo: 'a'.repeat(151) }), 'El título no puede pasar de 150 caracteres.');
eq('sin tipo', con({ tipo: '' }), 'Elija el tipo de evento.');
eq('fecha imposible', con({ fechaInicio: '2026-02-30' }), 'La fecha del evento no es válida.');
eq('fin antes del inicio', con({ fechaFin: '2026-10-01' }), 'La fecha de fin no puede ser anterior a la de inicio.');
eq('más de 60 días', con({ fechaFin: '2026-12-15' }), 'Un evento no puede durar más de 60 días.');
eq('ya pasó', con({ fechaInicio: '2026-09-20', fechaFin: '2026-09-21' }), 'La fecha del evento ya pasó.');
eq('fin sin inicio', con({ horaInicio: '', horaFin: '10:00' }), 'Indique la hora de inicio.');
eq('hora imposible', con({ horaInicio: '25:00' }), 'La hora no es válida.');
eq('fin antes que inicio el mismo día', con({ horaFin: '17:00' }), 'La hora de fin debe ser posterior a la de inicio.');
eq('profesional sin grupo', con({}, true), 'Elija uno de sus grupos: sólo la dirección crea eventos para todo el jardín.');
check('profesional con grupo, bien', con({ grupoId: 1 }, true) === null);

console.log('\n── "Agregar a mi calendario" ──');
const ics = generarIcs(ev({ id: 7, titulo: 'Reunión, padres; 2026', horaInicio: '18:00', horaFin: '20:00', lugar: 'Salón' }), new Date(Date.UTC(2026, 8, 30, 12)));
check('es un VCALENDAR con líneas CRLF', ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
check('las 6:00 p. m. de Colombia son las 23:00 UTC', ics.includes('DTSTART:20261002T230000Z') && ics.includes('DTEND:20261003T010000Z'), ics);
check('el título con comas y ; escapados', ics.includes('SUMMARY:Reunión\\, padres\\; 2026'));
check('con su lugar y un identificador estable', ics.includes('LOCATION:Salón') && ics.includes('UID:evento-7@agendakids'));
const icsDia = generarIcs(ev({ fechaInicio: '2026-10-05', fechaFin: '2026-10-09' }));
check('todo el día: fechas sin hora y el fin al día siguiente', icsDia.includes('DTSTART;VALUE=DATE:20261005') && icsDia.includes('DTEND;VALUE=DATE:20261010'), icsDia);

console.log('\n── El menú y los avisos ──');
const menu = new ObtenerMenuPorRol();
for (const r of [Rol.DIRECTOR, Rol.PROFESIONAL, Rol.PADRE]) {
    check(`${r} ve Eventos`, menu.ejecutar(new Sesion({ userType: r, userId: 1 })).some(o => o.ruta === 'eventos'));
}
check('soporte no', !menu.ejecutar(new Sesion({ userType: Rol.SOPORTE, userId: 1 })).some(o => o.ruta === 'eventos'));
const aviso = new Novedad({ tipo: 'evento', clave: 'evento-manana:7:2026-10-01', titulo: 'Mañana: Parque' });
check('un aviso de evento lleva al calendario', aviso.rutaDestino() === 'eventos' && aviso.icono() === 'event');

console.log('\n── El caso de uso ──');
let enviados = 0, cancelados = 0;
const caso = new AdministrarEventos({ eventoRepository: {
    async guardar() { enviados++; return ev({}); }, async cancelar() { cancelados++; }, async listar() { return cal; } } });
let error = null;
try { await caso.guardar(new NuevoEvento({ titulo: '' }), { hoy: HOY }); } catch (e) { error = e; }
check('con un error no se envía nada', error instanceof ValidationError && enviados === 0);
await caso.guardar(bien(), { hoy: HOY });
check('bien, se envía', enviados === 1);
check('cancelar lo dice', await caso.cancelar(7) === 'Evento cancelado.' && cancelados === 1);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
