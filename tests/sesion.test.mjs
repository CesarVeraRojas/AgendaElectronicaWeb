/**
 * sesion.test.mjs — La sesión es un token (BL-22).
 *
 * Se ejecuta con:  node tests/sesion.test.mjs
 *
 * Existe porque el cambio es invisible desde la pantalla: todo se ve igual
 * funcione la autenticación o no, hasta que un día deja de entrar nadie. Lo que
 * se fija aquí es que el token llega desde el login, se guarda, viaja en la
 * cabecera Authorization y NO viaja en ningún otro sitio.
 */
import { Sesion }     from '../src/domain/entities/Sesion.js';
import { aSesion }    from '../src/data/dto/mappers.js';
import { HttpClient } from '../src/data/datasources/HttpClient.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── El token llega desde login.php ──');

const respuesta = {
    success: true,
    token: 'a'.repeat(64),
    user_type: 'director',
    user: { id: 20, nombres: 'Carlos', apellidos: 'Vera', colegio_id: 1, email: 'c@v.test' },
};
const sesion = aSesion(respuesta);
check('el mapper recoge el token', sesion.token === 'a'.repeat(64));
check('y sigue recogiendo el usuario', sesion.userId === 20 && sesion.userType === 'director');
check('sin token en la respuesta, queda a null', aSesion({ user_type: 'padre', user: { id: 1 } }).token === null);

console.log('\n── Sin token no hay sesión ──');

check('con token, la sesión está autenticada', sesion.estaAutenticada === true);
check('sin token, NO lo está',
    new Sesion({ userType: 'director', userId: 20 }).estaAutenticada === false);
check('sin usuario tampoco',
    new Sesion({ token: 'x', userType: null, userId: null }).estaAutenticada === false);

console.log('\n── El token viaja en Authorization y en ningún otro sitio ──');

// Un fetch de mentira que recuerda cómo se le llamó.
let ultima = null;
globalThis.fetch = async (url, opciones) => {
    ultima = { url, opciones };
    return { ok: true, status: 200, text: async () => JSON.stringify({ success: true }) };
};

const http = new HttpClient({
    proveedorDeSesion: () => sesion,
    baseUrl: 'https://ejemplo.test/api/',
});

await http.get('get_mensajes.php', { folder: 'recibidos' });
check('el GET manda Authorization: Bearer',
    ultima.opciones.headers['Authorization'] === `Bearer ${'a'.repeat(64)}`);
check('el GET NO lleva user_id en la URL', !ultima.url.includes('user_id'), ultima.url);
check('el GET NO lleva user_type en la URL', !ultima.url.includes('user_type'), ultima.url);
check('pero sí lleva sus propios parámetros', ultima.url.includes('folder=recibidos'), ultima.url);
check('y ya no manda X-User-Id', ultima.opciones.headers['X-User-Id'] === undefined);

await http.post('crear_observacion.php', { estudiante_id: 100, texto: 'Hola' });
const cuerpo = JSON.parse(ultima.opciones.body);
check('el POST manda Authorization: Bearer',
    ultima.opciones.headers['Authorization'] === `Bearer ${'a'.repeat(64)}`);
check('el POST NO inyecta user_id en el cuerpo', cuerpo.user_id === undefined, ultima.opciones.body);
check('el POST NO inyecta user_type en el cuerpo', cuerpo.user_type === undefined, ultima.opciones.body);
check('y respeta el cuerpo que le dieron', cuerpo.estudiante_id === 100 && cuerpo.texto === 'Hola');

await http.put('grupos.php', { id: 1, nombre_grupo: 'Rojo' });
check('el PUT tampoco inyecta identidad', JSON.parse(ultima.opciones.body).user_id === undefined);

await http.postMultipart('subir_foto.php', 'datos-falsos');
check('el multipart manda Authorization: Bearer',
    ultima.opciones.headers['Authorization'] === `Bearer ${'a'.repeat(64)}`);
check('el multipart no fija Content-Type, que lo pone el navegador',
    ultima.opciones.headers['Content-Type'] === undefined);

console.log('\n── Sin sesión no se manda cabecera ──');

const sinSesion = new HttpClient({ proveedorDeSesion: () => null, baseUrl: 'https://ejemplo.test/api/' });
await sinSesion.get('login.php');
check('sin sesión, no va Authorization', ultima.opciones.headers['Authorization'] === undefined);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
