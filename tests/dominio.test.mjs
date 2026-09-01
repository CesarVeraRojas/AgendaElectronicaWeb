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
import { Mensaje }              from '../src/domain/entities/Mensaje.js';
import { Acudiente }            from '../src/domain/entities/Estudiante.js';
import { RegistrarAsistencia }  from '../src/domain/usecases/RegistrarAsistencia.js';
import { CrearEstudianteCompleto } from '../src/domain/usecases/CrearEstudianteCompleto.js';
import { IniciarSesion }        from '../src/domain/usecases/IniciarSesion.js';

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

check('director → 9 opciones (4 admin + 4 prof + mensajes)', menu.ejecutar(dir).length === 9,  `= ${menu.ejecutar(dir).length}`);
check('profesional → 5 opciones (4 + mensajes)',             menu.ejecutar(prof).length === 5, `= ${menu.ejecutar(prof).length}`);
check('padre → 4 opciones (3 + mensajes)',                   menu.ejecutar(pad).length === 4,  `= ${menu.ejecutar(pad).length}`);
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

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
