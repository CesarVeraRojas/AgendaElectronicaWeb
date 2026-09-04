/**
 * mappers.test.mjs — Normalización de las formas de respuesta del backend.
 *
 * Se ejecuta con:  node tests/mappers.test.mjs
 *
 * Existe por un fallo real: `respondWithSuccess($filas)` de helpers.php hace
 * `array_merge(["success"=>true], $filas)`. Si $filas es una lista, sus índices
 * 0,1,2… sobreviven como claves, el conjunto deja de ser un array PHP y
 * json_encode devuelve un OBJETO `{"success":true,"0":{…},"1":{…}}`.
 * Las listas de acudientes y estudiantes salían vacías por esto.
 */
import { comoLista } from '../src/data/dto/mappers.js';

let ok = 0, fail = 0;
const check = (nombre, cond, extra = '') => {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else      { fail++; console.log(`  ❌ ${nombre} ${extra}`); }
};

console.log('\n── comoLista(): las cuatro formas que devuelve el PHP ──');

// json_response($filas) — listar_profesionales.php, grupos.php
check('array pelado', comoLista([{ id: 1 }, { id: 2 }]).length === 2);

// respondWithSuccess($filas) — listar_padres.php, estudiantes.php
const fusionado = { success: true, '0': { id: 1 }, '1': { id: 2 }, '2': { id: 3 } };
check('objeto con índices numéricos fusionados en la raíz', comoLista(fusionado).length === 3);
check('  …y conserva el orden', comoLista(fusionado).map(f => f.id).join(',') === '1,2,3');
check('  …con 10+ filas ordena numéricamente, no como texto',
    comoLista(Object.fromEntries([['success', true], ...Array.from({ length: 11 }, (_, i) => [String(i), { id: i }])]))
        .map(f => f.id).join(',') === '0,1,2,3,4,5,6,7,8,9,10');

// Lista vacía: array_merge(["success"=>true], []) === {"success":true}
check('lista vacía → array vacío, no error', comoLista({ success: true }).length === 0);

// Formas ya soportadas antes
check('{data:[...]}',        comoLista({ data: [{ id: 1 }] }).length === 1);
check('{estudiantes:[...]}', comoLista({ estudiantes: [{ id: 1 }, { id: 2 }] }).length === 2);

// No debe confundir un objeto de detalle con una lista
check('objeto sin índices numéricos → vacío',
    comoLista({ success: true, colegio: { nombre: 'x' } }).length === 0);
check('null / undefined → vacío', comoLista(null).length === 0 && comoLista(undefined).length === 0);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
