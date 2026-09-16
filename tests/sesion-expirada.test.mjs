/**
 * sesion-expirada.test.mjs — Un token rechazado devuelve al login (BL-59).
 *
 * Se ejecuta con:  node tests/sesion-expirada.test.mjs
 *
 * Espejo de `EntradaAutomaticaTest.kt` en Android. Lo que se fija aquí es que la
 * aplicación reacciona a un 401 que es suyo, y **sólo** a ése: el 401 de
 * `login.php` es una contraseña equivocada, no una sesión caducada, y tratarlo
 * igual expulsaría al usuario de la pantalla en la que está intentando entrar.
 */
import { esTokenRechazado, alExpirarLaSesion, avisarSesionExpirada } from '../src/core/sesionExpirada.js';
import { HttpClient } from '../src/data/datasources/HttpClient.js';
import { AuthError, ServerError } from '../src/core/errors.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── Qué 401 es nuestro ──');

check('un 401 de una pantalla cualquiera lo es',
    esTokenRechazado(401, 'https://x.test/api/agenda/get_mensajes.php', true) === true);
check('el 401 de login.php NO lo es, que es la contraseña mal',
    esTokenRechazado(401, 'https://x.test/api/agenda/login.php', true) === false);
check('ni con parámetros detrás',
    esTokenRechazado(401, 'https://x.test/api/agenda/login.php?x=1', true) === false);
check('sin token nuestro, el 401 no habla de nosotros',
    esTokenRechazado(401, 'https://x.test/api/agenda/get_mensajes.php', false) === false);
check('un 403 no es una sesión caducada, es un rol sin permiso',
    esTokenRechazado(403, 'https://x.test/api/agenda/grupos.php', true) === false);
check('un 200 no lo es', esTokenRechazado(200, 'https://x.test/api/agenda/grupos.php', true) === false);
check('un 500 tampoco', esTokenRechazado(500, 'https://x.test/api/agenda/grupos.php', true) === false);

console.log('\n── El aviso llega a quien se suscribe ──');

let avisos = 0;
alExpirarLaSesion(() => { avisos++; });
avisarSesionExpirada();
check('se avisa al suscriptor', avisos === 1);

const antes = avisos;
alExpirarLaSesion(() => { throw new Error('revienta'); });
avisarSesionExpirada();
check('un suscriptor que falla no tumba la petición', avisos === antes);

console.log('\n── HttpClient ante un 401 ──');

const sesion = { token: 'a'.repeat(64), userId: 20, userType: 'director' };

function clienteQueResponde(status, cuerpo) {
    globalThis.fetch = async () => ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(cuerpo),
    });

    let rechazos = 0;
    const http = new HttpClient({
        proveedorDeSesion: () => sesion,
        alRechazarElToken: () => { rechazos++; },
        baseUrl: 'https://x.test/api/agenda/',
    });
    return { http, cuantosRechazos: () => rechazos };
}

{
    const { http, cuantosRechazos } = clienteQueResponde(401, { error: 'Autenticación requerida.' });
    let capturado = null;
    try { await http.get('get_mensajes.php'); } catch (e) { capturado = e; }

    check('avisa de que el token ya no vale', cuantosRechazos() === 1);
    check('y lo cuenta como AuthError, no como un error cualquiera',
        capturado instanceof AuthError, capturado?.name);
    check('con un texto que explica qué hacer',
        /inicie sesión de nuevo/i.test(capturado?.message ?? ''), capturado?.message);
}

{
    // login.php con la contraseña mal: el usuario tiene que ver el mensaje del
    // servidor, no que se le expulse de la pantalla de entrar.
    const { http, cuantosRechazos } = clienteQueResponde(401, { success: false, message: 'Credenciales inválidas.' });
    let capturado = null;
    try { await http.post('login.php', { email: 'a@b.test', password: 'mala' }); } catch (e) { capturado = e; }

    check('el 401 del login no dispara la expulsión', cuantosRechazos() === 0);
    check('y llega como ServerError', capturado instanceof ServerError, capturado?.name);
    check('con el mensaje del servidor intacto',
        capturado?.message === 'Credenciales inválidas.', capturado?.message);
}

{
    const { http, cuantosRechazos } = clienteQueResponde(403, { error: 'Acceso denegado: su rol no puede.' });
    try { await http.get('grupos.php'); } catch { /* da igual */ }
    check('un 403 no borra la sesión de nadie', cuantosRechazos() === 0);
}

{
    const { http, cuantosRechazos } = clienteQueResponde(200, { success: true, mensajes: [] });
    await http.get('get_mensajes.php');
    check('una respuesta buena no avisa de nada', cuantosRechazos() === 0);
}

{
    // Sin sesión no se manda cabecera, así que el 401 no es nuestro: es lo que
    // pasa si alguien abre una URL de la aplicación sin haber entrado.
    globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => '{}' });
    let rechazos = 0;
    const http = new HttpClient({
        proveedorDeSesion: () => null,
        alRechazarElToken: () => { rechazos++; },
        baseUrl: 'https://x.test/api/agenda/',
    });
    try { await http.get('get_mensajes.php'); } catch { /* da igual */ }
    check('sin sesión, un 401 no se toma como expulsión', rechazos === 0);
}

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
