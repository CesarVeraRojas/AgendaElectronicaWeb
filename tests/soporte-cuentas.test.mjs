/**
 * soporte-cuentas.test.mjs — Lo que soporte hace con las cuentas y la edición
 * de jardines (2026-11-20).
 *
 * Se ejecuta con:  node tests/soporte-cuentas.test.mjs
 *
 * Los textos de validación repiten los del servidor (soporte_usuarios.php y
 * soporte_editar_jardin.php); aquí se fijan.
 */
import { aCuentas, aContrasenaRestablecida, aEstadoCuenta, aJardines, aJardinEditado } from '../src/data/dto/mappers.js';
import { Cuenta, validarBusqueda, textoTipo, textoJardines, estadoCuenta, textoSesiones, textoConfirmarDesactivar } from '../src/domain/entities/Cuenta.js';
import { JardinEditado, validarJardinEditado } from '../src/domain/entities/Jardin.js';
import { AtenderCuentas } from '../src/domain/usecases/AtenderCuentas.js';
import { AdministrarJardines } from '../src/domain/usecases/AdministrarJardines.js';
import { CuentaRepositoryImpl } from '../src/data/repositories/CuentaRepositoryImpl.js';
import { JardinRepositoryImpl } from '../src/data/repositories/JardinRepositoryImpl.js';
import { ValidationError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { ok++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${x}`); } };

console.log('\n── El mapeo del buscador ──');
const r = aCuentas({ success: true, hay_mas: true, puede_desactivar: true, usuarios: [
    { tipo: 'profesional', id: '7', nombre: 'Marta Rios', email: 'marta@hc.co', jardines: [{ id: '1', nombre: 'Happy Children' }],
      activo: true, tiene_contrasena: true, ultimo_ingreso: '2026-11-20 08:15:00', ultima_actividad: null, sesiones_abiertas: '2' },
    { tipo: 'padre', id: 3, nombre: 'Luisa Peña', email: 'luisa@c.co', jardines: [{ id: 1, nombre: 'HC' }, { id: 2, nombre: 'Arcoíris' }],
      activo: false, tiene_contrasena: false },
]});
check('dos cuentas, de la clase correcta', r.cuentas.length === 2 && r.cuentas[0] instanceof Cuenta);
check('los números llegan como números', r.cuentas[0].id === 7 && r.cuentas[0].sesionesAbiertas === 2 && r.cuentas[0].jardines[0].id === 1);
check('estado y fechas', r.cuentas[0].activo && r.cuentas[0].ultimoIngreso === '2026-11-20 08:15:00' && r.cuentas[1].activo === false
    && r.cuentas[1].tieneContrasena === false && r.cuentas[1].sesionesAbiertas === 0);
check('hay más y se puede desactivar', r.hayMas === true && r.puedeDesactivar === true);
const vacia = aCuentas(null);
check('una respuesta rota no revienta (y no ofrece desactivar)', vacia.cuentas.length === 0 && vacia.puedeDesactivar === false);
const sinCampo = aCuentas({ usuarios: [{ tipo: 'director', id: 1, nombre: 'X' }] }).cuentas[0];
check('sin los campos nuevos, se asume activa y con contraseña', sinCampo.activo === true && sinCampo.tieneContrasena === true);

const rc = aContrasenaRestablecida({ success: true, contrasena: 'AbCdEfGh2345', sesiones_cerradas: 2, activo: false,
                                     usuario: { tipo: 'profesional', id: 7, nombre: 'Marta Rios', email: 'marta@hc.co' } });
check('la contraseña restablecida', rc.contrasena === 'AbCdEfGh2345' && rc.sesionesCerradas === 2 && rc.activo === false && rc.usuario.email === 'marta@hc.co');
check('el cambio de estado', aEstadoCuenta({ activo: false, sesiones_cerradas: 1 }).activo === false && aEstadoCuenta({ activo: true }).activo === true);

console.log('\n── Lo que se dice de una cuenta ──');
const [marta, luisa] = r.cuentas;
check('tipo legible', textoTipo(marta) === 'Profesional' && textoTipo(luisa) === 'Acudiente');
check('sus jardines', textoJardines(luisa) === 'HC, Arcoíris' && textoJardines(new Cuenta({ tipo: 'padre', id: 1, nombre: 'x' })) === 'Sin jardín');
check('activa', estadoCuenta(marta).texto === 'Activa' && !estadoCuenta(marta).aviso);
check('desactivada pesa más que sin contraseña', estadoCuenta(luisa).texto === 'Desactivada: no puede entrar' && estadoCuenta(luisa).aviso);
check('sin contraseña', estadoCuenta(new Cuenta({ tipo: 'padre', id: 1, nombre: 'x', tieneContrasena: false })).texto === 'Sin contraseña: todavía no puede entrar');
check('sesiones con plurales', textoSesiones(marta) === '2 sesiones abiertas' && textoSesiones(luisa) === 'Sin sesiones abiertas'
    && textoSesiones(new Cuenta({ tipo: 'padre', id: 1, nombre: 'x', sesionesAbiertas: 1 })) === '1 sesión abierta');
check('desactivar a un director avisa del jardín sin administrar',
    textoConfirmarDesactivar(new Cuenta({ tipo: 'director', id: 1, nombre: 'Carlos' })).includes('nadie podrá administrar el jardín')
    && !textoConfirmarDesactivar(marta).includes('administrar'));
check('y deja claro que no se borra nada', textoConfirmarDesactivar(marta).includes('No se borra nada'));

console.log('\n── El buscador exige 3 letras (mismas palabras que el servidor) ──');
check('"ma" no', validarBusqueda('ma') === 'Escriba al menos 3 letras para buscar.');
check('"  ma  " tampoco', validarBusqueda('  ma  ') !== null);
check('"mar" sí', validarBusqueda('mar') === null);

console.log('\n── El caso de uso de cuentas ──');
const llamadas = [];
const api = {
    async buscarCuentas(q) { llamadas.push(['buscar', q]); return { usuarios: [], puede_desactivar: true }; },
    async restablecerContrasena(tipo, id) { llamadas.push(['restablecer', tipo, id]); return { contrasena: 'x', usuario: {} }; },
    async cambiarEstadoCuenta(tipo, id, activo) { llamadas.push(['estado', tipo, id, activo]); return { activo }; },
};
const casos = new AtenderCuentas({ cuentaRepository: new CuentaRepositoryImpl({ apiDataSource: api }) });
let error = null;
try { await casos.buscar('ab'); } catch (e) { error = e; }
check('con menos de 3 letras no se pregunta al servidor', error instanceof ValidationError && llamadas.length === 0);
await casos.buscar('  marta rios ');
check('busca con el texto recortado', JSON.stringify(llamadas[0]) === '["buscar","marta rios"]', JSON.stringify(llamadas));
await casos.restablecerContrasena(marta);
check('restablecer manda tipo e id', JSON.stringify(llamadas[1]) === '["restablecer","profesional",7]');
check('desactivar manda activo=false', (await casos.desactivar(marta)).activo === false && llamadas[2][3] === false);
check('reactivar manda activo=true', (await casos.reactivar(luisa)).activo === true && JSON.stringify(llamadas[3]) === '["estado","padre",3,true]');

console.log('\n── Editar un jardín ──');
const [hc] = aJardines({ jardines: [{ id: 1, nombre: 'Happy Children', direccion: null, correo: 'hc@hc.co',
    directores: [{ id: 4, nombre: 'Carlos Vera', nombres: 'Carlos', apellidos: 'Vera', email: 'dir@hc.co', telefono: null }] }] });
check('la lista trae lo que hace falta para editar al director', hc.directores[0].id === 4 && hc.directores[0].nombres === 'Carlos' && hc.directores[0].telefono === '');
const e = JardinEditado.desde(hc);
check('el formulario arranca con lo que hay (nulls como vacío)', e.id === 1 && e.direccion === '' && e.correo === 'hc@hc.co'
    && e.directores[0].email === 'dir@hc.co' && e.directores[0].telefono === '');
const con = (cambios, dir = {}) => validarJardinEditado(new JardinEditado({ ...e, ...cambios,
    directores: [{ ...e.directores[0], ...dir }] }));
check('sin cambios: bien', con({}) === null);
check('sin nombre', con({ nombre: ' ' }) === 'El nombre del jardín es obligatorio.');
check('correo del jardín inválido', con({ correo: 'x@' }) === 'El correo del jardín no es válido.');
check('correo vacío vale', con({ correo: '' }) === null);
check('director sin apellidos', con({}, { apellidos: '' }) === 'Los nombres y apellidos del director son obligatorios.');
check('correo del director inválido', con({}, { email: 'dir@' }) === 'El correo del director no es válido.');
check('dos directores con el mismo correo', validarJardinEditado(new JardinEditado({ ...e,
    directores: [e.directores[0], { ...e.directores[0], id: 5, email: 'DIR@hc.co' }] })) === 'Dos directores no pueden tener el mismo correo.');

let enviado = null;
const admin = new AdministrarJardines({ jardinRepository: new JardinRepositoryImpl({ apiDataSource: {
    async editarJardin(cuerpo) { enviado = cuerpo; return { jardin: { id: 1, nombre: cuerpo.nombre }, directores_actualizados: 1 }; },
} }) });
error = null;
try { await admin.editar(new JardinEditado({ ...e, nombre: '' })); } catch (x) { error = x; }
check('con un error no se envía nada', error instanceof ValidationError && enviado === null);
const res = await admin.editar(new JardinEditado({ ...e, nombre: ' Kindergarten HC ',
    directores: [{ ...e.directores[0], email: ' carlos@hc.co ', telefono: ' 300 ' }] }));
check('se envía recortado, con el id del director', enviado.nombre === 'Kindergarten HC' && enviado.directores[0].id === 4
    && enviado.directores[0].email === 'carlos@hc.co' && enviado.directores[0].telefono === '300', JSON.stringify(enviado));
check('sin documento ni contraseña en lo enviado', !('documento' in enviado.directores[0]) && !('password' in enviado.directores[0]));
check('la respuesta', res.jardin.nombre === 'Kindergarten HC' && res.directoresActualizados === 1);
check('respuesta rota de la edición', aJardinEditado(null).directoresActualizados === 0);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
