/**
 * jardines.test.mjs — Soporte y el alta de jardines (BL-74).
 *
 * Se ejecuta con:  node tests/jardines.test.mjs
 *
 * Las reglas del alta repiten las del servidor (soporte_alta_jardin.php) con las
 * mismas palabras; aquí se fijan.
 */
import { aJardines, aAltaDeJardin } from '../src/data/dto/mappers.js';
import { Jardin, NuevoJardin, validarNuevoJardin, textoCifras, textoLogo, generarContrasena } from '../src/domain/entities/Jardin.js';
import { AdministrarJardines } from '../src/domain/usecases/AdministrarJardines.js';
import { ObtenerMenuPorRol } from '../src/domain/usecases/ObtenerMenuPorRol.js';
import { Sesion, Rol } from '../src/domain/entities/Sesion.js';
import { ValidationError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { ok++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${x}`); } };

console.log('\n── El menú de soporte ──');
const menu = new ObtenerMenuPorRol();
const ops = menu.ejecutar(new Sesion({ userType: Rol.SOPORTE, userId: 1 }));
check('soporte sólo ve "Jardines"', ops.length === 1 && ops[0].ruta === 'jardines', JSON.stringify(ops));
check('sin circulares ni mensajes, que son de un jardín', !ops.some(o => ['circulares', 'mensajes'].includes(o.ruta)));
check('el director sigue sin ver "Jardines"', !menu.ejecutar(new Sesion({ userType: Rol.DIRECTOR, userId: 1 })).some(o => o.ruta === 'jardines'));
check('soporte no lleva el pie del colegio', menu.debeMostrarPieColegio(new Sesion({ userType: Rol.SOPORTE, userId: 1 })) === false);

console.log('\n── El mapeo ──');
const lista = aJardines({ success: true, jardines: [
    { id: 1, nombre: 'Happy Children', direccion: null, correo: null, creado: '2026-01-10 08:00:00',
      directores: [{ nombre: 'Carlos Vera', email: 'dir@hc.co' }], alumnos: 22, grupos: 4, profesionales: 3, familias: 22,
      logo: 'colegio_1.png', logo_esperado: 'colegio_1.png' },
    { id: 2, nombre: 'Arcoíris', directores: [], alumnos: '1', grupos: 1, profesionales: 0, familias: 1, logo: null, logo_esperado: 'colegio_2.png' },
]});
check('dos jardines', lista.length === 2 && lista[0] instanceof Jardin);
check('los números llegan como números', lista[1].alumnos === 1 && lista[0].alumnos === 22);
check('con sus directores', lista[0].directores[0].email === 'dir@hc.co' && lista[1].directores.length === 0);
check('una respuesta rota no revienta', aJardines(null).length === 0);
const alta = aAltaDeJardin({ success: true, jardin: { id: 9, nombre: 'Arcoíris' }, director: { id: 4, nombre: 'Paula Gómez', email: 'paula@a.co' }, logo_esperado: 'colegio_9.png' });
check('la respuesta del alta', alta.jardin.id === 9 && alta.director.email === 'paula@a.co' && alta.logoEsperado === 'colegio_9.png');

console.log('\n── Lo que se dice ──');
check('cifras con plurales', textoCifras(lista[0]) === '22 alumnos · 4 grupos · 3 profesionales · 22 familias', textoCifras(lista[0]));
check('cifras con singulares', textoCifras(lista[1]) === '1 alumno · 1 grupo · 0 profesionales · 1 familia', textoCifras(lista[1]));
check('con logo', textoLogo(lista[0]) === 'Logo: colegio_1.png');
check('sin logo, con qué nombre subirlo', textoLogo(lista[1]) === 'Sin logo. Súbalo como colegio_2.png en uploads/logos');

console.log('\n── Lo que se exige (mismas palabras que el servidor) ──');
const bien = () => new NuevoJardin({ nombre: 'Arcoíris', director: { nombres: 'Paula', apellidos: 'Gómez', tipoDocumento: 'CC',
    documento: '52123456', email: 'paula@arcoiris.co', telefono: '', password: 'Inicial-2026' } });
const con = (cambios, enDirector = true) => { const n = bien(); Object.assign(enDirector ? n.director : n, cambios); return validarNuevoJardin(n); };
check('todo bien: sin error', validarNuevoJardin(bien()) === null);
check('sin nombre', con({ nombre: '  ' }, false) === 'El nombre del jardín es obligatorio.');
check('correo del jardín inválido', con({ correo: 'x@' }, false) === 'El correo del jardín no es válido.');
check('sin apellidos', con({ apellidos: '' }) === 'Los nombres y apellidos del director son obligatorios.');
check('tarjeta de identidad no vale', con({ tipoDocumento: 'TI' }) === 'El tipo y el número de documento del director son obligatorios.');
check('correo del director inválido', con({ email: 'paula@' }) === 'El correo del director no es válido.');
check('contraseña de 7', con({ password: '1234567' }) === 'La contraseña inicial debe tener al menos 8 caracteres.');

console.log('\n── La contraseña generada ──');
const c = generarContrasena();
check('12 caracteres', c.length === 12, c);
check('sin los que se confunden al dictarlos (0 O 1 l I)', !/[0O1lI]/.test(generarContrasena(() => Uint32Array.from({ length: 12 }, (_, i) => i * 5))));
check('dos seguidas no se repiten', generarContrasena() !== generarContrasena());

console.log('\n── El caso de uso ──');
let enviados = 0;
const caso = new AdministrarJardines({ jardinRepository: { async darDeAlta() { enviados++; return alta; }, async listar() { return lista; } } });
let error = null;
try { await caso.darDeAlta(new NuevoJardin({ nombre: '' })); } catch (e) { error = e; }
check('con un error no se envía nada', error instanceof ValidationError && enviados === 0);
check('bien, se envía', (await caso.darDeAlta(bien())).jardin.id === 9 && enviados === 1);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
