/**
 * logo.test.mjs — El logo de cada jardín en el menú (BL-75).
 *
 * Se ejecuta con:  node tests/logo.test.mjs
 *
 * Reglas: sin logo o con un fallo, el de AgendaKids; el logo se recuerda
 * durante la sesión, pero no pasa de un usuario a otro.
 */
import { aLogoDelColegio } from '../src/data/dto/mappers.js';
import { ObtenerLogoDelColegio, LOGO_AGENDAKIDS } from '../src/domain/usecases/ObtenerLogoDelColegio.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── El mapeo ──');
const URL = 'https://kindergartenhappychildren.com/api/agenda/uploads/logos/colegio_7.png?v=1759240000';
check('una URL https se toma tal cual', aLogoDelColegio({ success: true, colegio_id: 7, logo_url: URL }) === URL);
check('sin logo, null', aLogoDelColegio({ success: true, colegio_id: 8, logo_url: null }) === null);
check('una respuesta rota, null', aLogoDelColegio(null) === null && aLogoDelColegio('x') === null);
check('algo que no es http(s) no se acepta', aLogoDelColegio({ logo_url: 'javascript:alert(1)' }) === null);

console.log('\n── El caso de uso ──');
const director = { userType: 'director', userId: 7 };
const otro     = { userType: 'padre', userId: 30 };

{
    let llamadas = 0;
    const caso = new ObtenerLogoDelColegio({ colegioRepository: { async obtenerLogo() { llamadas++; return URL; } } });
    check('antes de preguntar, el de AgendaKids', caso.inmediato(director) === LOGO_AGENDAKIDS);
    check('al preguntar, el del jardín', await caso.ejecutar(director) === URL && llamadas === 1);
    check('y se recuerda para volver al menú sin parpadeo', caso.inmediato(director) === URL);
    check('pero no pasa a otro usuario que entre después', caso.inmediato(otro) === LOGO_AGENDAKIDS);
}
{
    const caso = new ObtenerLogoDelColegio({ colegioRepository: { async obtenerLogo() { return null; } } });
    check('un jardín sin logo se queda con el de AgendaKids', await caso.ejecutar(director) === LOGO_AGENDAKIDS);
}
{
    const caso = new ObtenerLogoDelColegio({ colegioRepository: { async obtenerLogo() { throw new Error('sin red'); } } });
    check('si falla la consulta no lanza y deja el de AgendaKids', await caso.ejecutar(director) === LOGO_AGENDAKIDS);
}
{
    let respuesta = URL;
    const caso = new ObtenerLogoDelColegio({ colegioRepository: { async obtenerLogo() {
        if (respuesta instanceof Error) throw respuesta; return respuesta; } } });
    await caso.ejecutar(director);
    respuesta = new Error('sin red');
    check('si ya se conocía y luego falla la red, se mantiene el del jardín', await caso.ejecutar(director) === URL);
}

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
