/**
 * escapado.test.mjs — Verifica la defensa contra XSS (BL-27 / A05 Injection).
 * Los asuntos y nombres los escriben usuarios y llegan sin sanear desde el PHP.
 */
import { esc, html, crudo } from '../src/presentation/components/html.js';

let ok = 0, fail = 0;
const check = (n, c, extra='') => { c ? (ok++, console.log(`  ✅ ${n}`)) : (fail++, console.log(`  ❌ ${n} ${extra}`)); };

const ATAQUES = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '" onmouseover="alert(1)',
    "' onfocus='alert(1)",
    '<svg/onload=alert(1)>',
];

console.log('\n── esc() neutraliza los vectores comunes ──');
for (const a of ATAQUES) {
    const salida = esc(a);
    check(`${a.slice(0, 28)}…`, !/[<>]/.test(salida) && !salida.includes('"') && !salida.includes("'"), `→ ${salida}`);
}

console.log('\n── html`` escapa las interpolaciones automáticamente ──');
const asuntoMalicioso = '<img src=x onerror=alert(1)>';
const salida = html`<p class="msg">${asuntoMalicioso}</p>`;
check('el payload queda inerte', !salida.includes('<img'), `→ ${salida}`);
check('conserva el marcado propio', salida.startsWith('<p class="msg">'));

console.log('\n── crudo() permite componer HTML ya construido ──');
const compuesto = html`<div>${crudo('<span>seguro</span>')}</div>`;
check('crudo() no se escapa', compuesto === '<div><span>seguro</span></div>', `→ ${compuesto}`);

console.log('\n── arrays y valores nulos ──');
check('array escapa cada elemento', !html`${['<b>', '<i>']}`.includes('<b>'));
check('null → cadena vacía',        html`[${null}]` === '[]');
check('undefined → cadena vacía',   html`[${undefined}]` === '[]');
check('0 se conserva',              html`[${0}]` === '[0]');

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
