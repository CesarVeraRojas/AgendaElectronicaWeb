/**
 * dominio.test.mjs — Pruebas de la lógica de negocio.
 *
 * Se ejecutan con:  node tests/dominio.test.mjs
 * No necesitan navegador, ni red, ni base de datos: el dominio está aislado.
 * Eso es lo que valida que la arquitectura esté bien separada.
 */
import { Sesion, Rol }          from '../src/domain/entities/Sesion.js';
import { ObtenerMenuPorRol }    from '../src/domain/usecases/ObtenerMenuPorRol.js';
import { PrepararRespuesta }    from '../src/domain/usecases/PrepararRespuesta.js';
import { Mensaje, DestinatarioLectura, resumirLectura } from '../src/domain/entities/Mensaje.js';
import { Acudiente }            from '../src/domain/entities/Estudiante.js';
import { RegistrarAsistencia }  from '../src/domain/usecases/RegistrarAsistencia.js';
import { EstadoAsistencia, resumirAsistencia } from '../src/domain/entities/Asistencia.js';
import { rangoDelMes, mesAnterior, mesSiguiente } from '../src/domain/usecases/ObtenerAsistenciaDeHijo.js';
import { CrearEstudianteCompleto } from '../src/domain/usecases/CrearEstudianteCompleto.js';
import { IniciarSesion }        from '../src/domain/usecases/IniciarSesion.js';
import { calcularCambios, primerObligatorioVacio } from '../src/domain/usecases/_cambios.js';
import { ActualizarPadre }      from '../src/domain/usecases/ActualizarPadre.js';
import { ActualizarGrupo }      from '../src/domain/usecases/ActualizarGrupo.js';
import { ObtenerEstadoLectura } from '../src/domain/usecases/ObtenerEstadoLectura.js';
import { Novedad, TipoNovedad, filtrarNoAvisadas, recortarClaves, textoContador } from '../src/domain/entities/Novedad.js';
import { ObtenerNovedades }   from '../src/domain/usecases/ObtenerNovedades.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra='') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── Menú por rol (regla de MenuScreen.kt) ──');
const menu = new ObtenerMenuPorRol();
const dir  = new Sesion({ userType: Rol.DIRECTOR,    userId: 1, colegioId: 1, nombres: 'Ana' });
const prof = new Sesion({ userType: Rol.PROFESIONAL, userId: 2, colegioId: 1, nombres: 'Luis' });
const pad  = new Sesion({ userType: Rol.PADRE,       userId: 3, colegioId: null, nombres: 'Eva' });

check('director → 10 opciones (5 admin + 4 prof + mensajes)', menu.ejecutar(dir).length === 10, `= ${menu.ejecutar(dir).length}`);
check('sólo el director ve Actualizar Datos',
    menu.ejecutar(dir).some(o => o.ruta === 'actualizar-datos') &&
    !menu.ejecutar(prof).some(o => o.ruta === 'actualizar-datos') &&
    !menu.ejecutar(pad).some(o => o.ruta === 'actualizar-datos'));
check('profesional → 5 opciones (4 + mensajes)',             menu.ejecutar(prof).length === 5, `= ${menu.ejecutar(prof).length}`);
check('padre → 5 opciones (4 + mensajes)',                   menu.ejecutar(pad).length === 5,  `= ${menu.ejecutar(pad).length}`);
check('padre ve su asistencia, no la de registro',
    menu.ejecutar(pad).some(o => o.ruta === 'asistencia-hijo') &&
    !menu.ejecutar(pad).some(o => o.ruta === 'asistencia'));
check('Asistencia del padre va después de Fotos',
    menu.ejecutar(pad).findIndex(o => o.ruta === 'asistencia-hijo') ===
    menu.ejecutar(pad).findIndex(o => o.ruta === 'fotos-hijo') + 1);
check('todos ven Mensajes al final',  ['director','profesional','padre'].every(r =>
    menu.ejecutar(new Sesion({userType:r,userId:1})).at(-1).ruta === 'mensajes'));
check('padre ve rutas *-hijo',        menu.ejecutar(pad).some(o => o.ruta === 'agenda-diaria-hijo'));
check('profesional NO ve rutas admin',!menu.ejecutar(prof).some(o => o.ruta === 'crear-grupo'));
check('pie de colegio: sí padre/profesional, no director',
    menu.debeMostrarPieColegio(pad) && menu.debeMostrarPieColegio(prof) && !menu.debeMostrarPieColegio(dir));

console.log('\n── Prefijo "Re:" (regla de ComposeMensajeViewModel.setupReply) ──');
const pr = new PrepararRespuesta();
const base = { id:1, remitenteId:7, remitenteType:'padre', destinatarioId:2, destinatarioType:'profesional',
               mensaje:'x', fechaEnvio:'2026-01-01 10:00:00', leido:0, remitenteNombre:'Eva' };
check('añade "Re: " si no lo tiene',   pr.ejecutar(new Mensaje({...base, asunto:'Hola'})).asunto === 'Re: Hola');
check('no duplica "Re: "',             pr.ejecutar(new Mensaje({...base, asunto:'Re: Hola'})).asunto === 'Re: Hola');
check('no duplica ignorando mayúsculas',pr.ejecutar(new Mensaje({...base, asunto:'RE: Hola'})).asunto === 'RE: Hola');
check('destinatario = remitente original', pr.ejecutar(new Mensaje({...base, asunto:'Hola'})).destinatarios[0].id === 7);

console.log('\n── No leído: sólo en recibidos (regla de MensajesScreen.kt) ──');
const m0 = new Mensaje({...base, asunto:'a', leido:0});
const m1 = new Mensaje({...base, asunto:'a', leido:1});
check('leido=0 en recibidos → no leído', m0.esNoLeido(true) === true);
check('leido=0 en enviados → NO marca',  m0.esNoLeido(false) === false);
check('leido=1 nunca marca',             m1.esNoLeido(true) === false);

console.log('\n── Acudiente opcional (regla de CrearEstudianteActivity) ──');
const lleno = new Acudiente({tipoDocumento:'CC',documento:'1',nombres:'A',apellidos:'B',
    parentesco:'Papá',telefono:'3',direccion:'d',email:'e@e.com',password:'p'});
check('acudiente completo → true',        lleno.estaCompleto() === true);
check('falta un campo → false',           new Acudiente({...lleno, email:''}).estaCompleto() === false);
check('campo sólo con espacios → false',  new Acudiente({...lleno, nombres:'   '}).estaCompleto() === false);

console.log('\n── Asistencia: se envía uno por uno y en mayúsculas ──');
const enviados = [];
const uc = new RegistrarAsistencia({ asistenciaRepository: { async registrar(r){ enviados.push(r); } } });
await uc.ejecutar({ sesion: prof, fecha:'2026-08-26', estudiantes: [
    { estudiante:{id:10}, estado:'ASISTIO' }, { estudiante:{id:11}, estado:'tarde' }]});
check('una llamada por estudiante',  enviados.length === 2, `= ${enviados.length}`);
check('estado normalizado a mayúsculas', enviados[1].estado === 'TARDE', `= ${enviados[1].estado}`);
check('registradoPor = usuario en sesión', enviados[0].registradoPor === 2);

console.log('\n── Crear estudiante: orquestación de 5 pasos ──');
const pasos = [];
const repoEst = {
    async crear(e){ pasos.push('crear-estudiante'); return 99; },
    async crearAcudiente(a){ pasos.push('crear-acudiente'); return 50 + pasos.length; },
    async asignarAcudientes(id, ids){ pasos.push(`asignar-acudientes(${ids.length})`); },
    async asignarAGrupo(id, g){ pasos.push('asignar-grupo'); },
};
const ucEst = new CrearEstudianteCompleto({ estudianteRepository: repoEst });
await ucEst.ejecutar({ sesion: dir, estudiante:{nombres:'N'}, acudiente1: lleno,
                       acudiente2: new Acudiente({...lleno, email:''}), grupoId: 5 });
check('acudiente 2 incompleto se omite', !pasos.includes('asignar-acudientes(2)'), `pasos=${pasos.join(' → ')}`);
check('orden correcto de los 5 pasos',
    pasos.join('|') === 'crear-estudiante|crear-acudiente|asignar-acudientes(1)|asignar-grupo', `= ${pasos.join(' → ')}`);

console.log('\n── Validación previa del login ──');
const ucLogin = new IniciarSesion({ authRepository:{ async iniciarSesion(){ throw new Error('no debió llamarse'); } },
                                    sesionRepository:{ guardar(){}, obtener(){return null;}, limpiar(){} } });
let lanzo = false;
try { await ucLogin.ejecutar('', ''); } catch(e){ lanzo = e.name === 'ValidationError'; }
check('email/clave vacíos → ValidationError sin tocar la red', lanzo);

console.log('\n── Actualización de datos: sólo se envía lo que cambió ──');

const padreOriginal = {
    id: 7, tipoDocumento: 'CC', documento: '123', nombres: 'Ana', apellidos: 'Ruiz',
    parentesco: 'Mamá', telefono: '300', email: 'ana@x.com', direccion: 'Calle 1',
};
const CAMPOS_PADRE = ['tipoDocumento','documento','nombres','apellidos','parentesco','telefono','email','direccion'];

check('sin tocar nada → diff vacío',
    Object.keys(calcularCambios(padreOriginal, { ...padreOriginal }, CAMPOS_PADRE)).length === 0);

check('cambiar el email → sólo viaja el email',
    JSON.stringify(calcularCambios(padreOriginal, { ...padreOriginal, email: 'nueva@x.com' }, CAMPOS_PADRE))
    === JSON.stringify({ email: 'nueva@x.com' }));

check('los espacios sobrantes no cuentan como cambio',
    Object.keys(calcularCambios(padreOriginal, { ...padreOriginal, nombres: '  Ana  ' }, CAMPOS_PADRE)).length === 0);

check('un campo fuera de la lista permitida nunca viaja',
    calcularCambios(padreOriginal, { ...padreOriginal, password: 'x' }, CAMPOS_PADRE).password === undefined);

check('null y cadena vacía se tratan igual',
    Object.keys(calcularCambios({ telefono: null }, { telefono: '' }, ['telefono'])).length === 0);

check('detecta el primer obligatorio vacío',
    primerObligatorioVacio({ nombres: '', apellidos: 'Ruiz' }, { nombres: 'Nombres', apellidos: 'Apellidos' }) === 'Nombres');

// El repositorio se simula: el dominio no sabe que existe la red.
const repoFalso = { llamadas: [], async actualizar(id, cambios) { this.llamadas.push({ id, cambios }); } };
const actualizarPadre = new ActualizarPadre({ padreRepository: repoFalso });

await actualizarPadre.ejecutar({ original: padreOriginal, editado: { ...padreOriginal, telefono: '301' } });
check('ActualizarPadre manda id y sólo el campo tocado',
    repoFalso.llamadas.length === 1 &&
    repoFalso.llamadas[0].id === 7 &&
    JSON.stringify(repoFalso.llamadas[0].cambios) === JSON.stringify({ telefono: '301' }));

let sinCambios = false;
try { await actualizarPadre.ejecutar({ original: padreOriginal, editado: { ...padreOriginal } }); }
catch (e) { sinCambios = e.name === 'ValidationError'; }
check('sin cambios → ValidationError y no se llama a la red',
    sinCambios && repoFalso.llamadas.length === 1);

let obligatorio = false;
try { await actualizarPadre.ejecutar({ original: padreOriginal, editado: { ...padreOriginal, nombres: '' } }); }
catch (e) { obligatorio = e.name === 'ValidationError'; }
check('vaciar un obligatorio → ValidationError', obligatorio && repoFalso.llamadas.length === 1);

// grupos.php (PUT) exige nombre_grupo siempre: aquí el diff sólo decide si se llama.
const repoGrupo = { recibido: null, async actualizar(id, datos) { this.recibido = { id, datos }; } };
await new ActualizarGrupo({ grupoRepository: repoGrupo }).ejecutar({
    original: { id: 3, nombreGrupo: 'Párvulos', descripcion: 'Antigua' },
    editado:  { nombreGrupo: 'Párvulos', descripcion: 'Nueva' },
});
check('ActualizarGrupo envía la ficha completa, no el diff',
    repoGrupo.recibido.id === 3 &&
    repoGrupo.recibido.datos.nombreGrupo === 'Párvulos' &&
    repoGrupo.recibido.datos.descripcion === 'Nueva');

console.log('\n── Asistencia del hijo: rango del mes y resumen ──');
const feb = rangoDelMes(2026, 2);
check('febrero de 2026 → del 01 al 28', feb.desde === '2026-02-01' && feb.hasta === '2026-02-28', `= ${feb.hasta}`);
check('año bisiesto: febrero de 2024 llega al 29', rangoDelMes(2024, 2).hasta === '2024-02-29');
check('meses de un dígito se rellenan a dos', rangoDelMes(2026, 9).desde === '2026-09-01');
check('enero hacia atrás → diciembre del año anterior',
    JSON.stringify(mesAnterior({ anio: 2026, mes: 1 })) === JSON.stringify({ anio: 2025, mes: 12 }));
check('diciembre hacia delante → enero del año siguiente',
    JSON.stringify(mesSiguiente({ anio: 2026, mes: 12 })) === JSON.stringify({ anio: 2027, mes: 1 }));

const resumen = resumirAsistencia([
    { estado: EstadoAsistencia.ASISTIO }, { estado: EstadoAsistencia.ASISTIO },
    { estado: EstadoAsistencia.TARDE },   { estado: EstadoAsistencia.AUSENTE },
]);
check('cuenta los tres estados', resumen.asistio === 2 && resumen.tarde === 1 && resumen.ausente === 1);
check('el total es la suma de los tres', resumen.total === 4);
check('un estado desconocido no se cuenta', resumirAsistencia([{ estado: 'RARO' }]).total === 0);
check('lista vacía → todo a cero', resumirAsistencia([]).total === 0);

console.log('\n── Estado de lectura de un mensaje enviado (BL-46) ──');

const destinatario = (nombre, leido) => new DestinatarioLectura({
    mensajeId: 1, destinatarioId: 1, destinatarioType: 'padre', nombre, leido,
});

check('leido = 1 cuenta como leído',   destinatario('Luisa', 1).haLeido() === true);
check('leido = 0 cuenta como no leído', destinatario('Jorge', 0).haLeido() === false);
check('el "1" que manda el PHP como cadena también cuenta',
    destinatario('Carlos', '1').haLeido() === true);

const lectura = resumirLectura([destinatario('Luisa', 1), destinatario('Jorge', 0), destinatario('Carlos', 0)]);
check('cuenta los leídos', lectura.leidos === 1 && lectura.total === 3);
check('cuenta los que faltan', lectura.pendientes === 2);
check('no da por leído lo que no lo está', lectura.todosLeidos === false);

const todos = resumirLectura([destinatario('Luisa', 1), destinatario('Jorge', 1)]);
check('todos leídos', todos.todosLeidos === true && todos.pendientes === 0);
check('lista vacía no es "todos leídos"', resumirLectura([]).todosLeidos === false);
check('lista vacía suma cero', resumirLectura([]).total === 0);

const estadoLectura = new ObtenerEstadoLectura({ mensajeRepository: null });
const mio = new Mensaje({ id: 5, remitenteId: 7, remitenteType: 'profesional', asunto: 'a', mensaje: 'b' });
const ajeno = new Mensaje({ id: 6, remitenteId: 9, remitenteType: 'profesional', asunto: 'a', mensaje: 'b' });
const yo = new Sesion({ userType: 'profesional', userId: 7, colegioId: 1, nombres: 'Marta' });

check('reconoce mi propio mensaje', estadoLectura.esRemitente(mio, yo) === true);
check('el id que llega como cadena también casa',
    estadoLectura.esRemitente(new Mensaje({ id: 5, remitenteId: '7', remitenteType: 'profesional', asunto: 'a', mensaje: 'b' }), yo) === true);
check('un mensaje de otra persona no es mío', estadoLectura.esRemitente(ajeno, yo) === false);
check('mismo id pero otro rol no es mío',
    estadoLectura.esRemitente(new Mensaje({ id: 5, remitenteId: 7, remitenteType: 'director', asunto: 'a', mensaje: 'b' }), yo) === false);
check('sin sesión no es mío', estadoLectura.esRemitente(mio, null) === false);

check('en Enviados, leido = 1 marca la tarjeta como leída',
    new Mensaje({ id: 1, leido: 1, asunto: 'a', mensaje: 'b' }).leidoPorDestinatario() === true);
check('en Enviados, leido = 0 la deja sin leer',
    new Mensaje({ id: 1, leido: 0, asunto: 'a', mensaje: 'b' }).leidoPorDestinatario() === false);

console.log('\n── Avisos de novedades (BL-50) ──');

const nov = (tipo, clave) => new Novedad({ tipo, clave, titulo: 't', texto: 'x', fecha: '2026-09-09 10:00:00' });

check('el mensaje lleva a la bandeja',      nov(TipoNovedad.MENSAJE, 'mensaje:1').rutaDestino() === 'mensajes');
check('la observación lleva a la del hijo', nov(TipoNovedad.OBSERVACION, 'observacion:1').rutaDestino() === 'observaciones-hijo');
check('la agenda lleva a la del hijo',      nov(TipoNovedad.AGENDA, 'agenda:1:2026-09-09').rutaDestino() === 'agenda-diaria-hijo');
check('un tipo desconocido no rompe la navegación', nov('otro', 'x:1').rutaDestino() === 'menu');

const lote = [nov(TipoNovedad.MENSAJE, 'mensaje:1'), nov(TipoNovedad.AGENDA, 'agenda:100:2026-09-09')];
check('sin nada avisado, pasan todas', filtrarNoAvisadas(lote, []).length === 2);
check('lo ya avisado se descarta', filtrarNoAvisadas(lote, ['mensaje:1']).length === 1);
check('la agenda retocada no vuelve a avisar',
    filtrarNoAvisadas(lote, ['mensaje:1', 'agenda:100:2026-09-09']).length === 0);
check('lista vacía no rompe', filtrarNoAvisadas([], ['mensaje:1']).length === 0);

check('las claves no crecen sin límite', recortarClaves(Array.from({ length: 250 }, (_, i) => `k${i}`), 200).length === 200);
check('y se quedan las últimas', recortarClaves(['a', 'b', 'c'], 2).join() === 'b,c');
check('por debajo del tope no se toca nada', recortarClaves(['a', 'b'], 5).join() === 'a,b');

check('contador en cero', textoContador(0) === 'Sin novedades');
check('contador en uno, sin plural', textoContador(1) === '1 novedad');
check('contador en varios', textoContador(4) === '4 novedades');

// El caso de uso, con un repositorio de mentira
function repoDeNovedades({ novedades = [], avisadas = [], ahora = '2026-09-09 12:00:00' } = {}) {
    return {
        guardadas: null, clavesGuardadas: null, olvidado: false, pedidoDesde: undefined,
        ultimaConsulta() { return '2026-09-09 11:00:00'; },
        async consultar(desde) { this.pedidoDesde = desde; return { ahora, novedades }; },
        clavesAvisadas() { return avisadas; },
        guardarUltimaConsulta(a) { this.guardadas = a; },
        guardarClavesAvisadas(c) { this.clavesGuardadas = c; },
        olvidar() { this.olvidado = true; },
    };
}

let repo = repoDeNovedades({ novedades: lote });
let caso = new ObtenerNovedades({ novedadRepository: repo });
let nuevas = await caso.ejecutar();
check('devuelve lo que no se había avisado', nuevas.length === 2);
check('pregunta desde la marca guardada', repo.pedidoDesde === '2026-09-09 11:00:00');
check('guarda la hora que dio el servidor, no la del navegador', repo.guardadas === '2026-09-09 12:00:00');
check('recuerda las claves avisadas', repo.clavesGuardadas.join() === 'mensaje:1,agenda:100:2026-09-09');

repo = repoDeNovedades({ novedades: lote, avisadas: ['mensaje:1', 'agenda:100:2026-09-09'] });
caso = new ObtenerNovedades({ novedadRepository: repo });
nuevas = await caso.ejecutar();
check('sin novedades nuevas no devuelve nada', nuevas.length === 0);
check('y no reescribe las claves', repo.clavesGuardadas === null);
check('pero sí avanza la marca de tiempo', repo.guardadas === '2026-09-09 12:00:00');

caso.olvidar();
check('al cerrar sesión se olvida lo guardado', repo.olvidado === true);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
