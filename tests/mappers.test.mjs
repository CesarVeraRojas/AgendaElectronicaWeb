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
import { comoLista, aAsistenciaDeHijo, aDestinatarioLectura, aNovedad } from '../src/data/dto/mappers.js';

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

console.log('\n── aAsistenciaDeHijo(): get_asistencias_por_hijo.php ──');

// El endpoint responde con json_response($filas): array pelado.
const filas = [
    { id: 9, fecha: '2026-09-03', estado: 'TARDE',   profesional_nombre: 'Luis Gómez' },
    { id: 8, fecha: '2026-09-02', estado: 'ASISTIO', profesional_nombre: 'Profesional Desconocido' },
];
const registros = comoLista(filas).map(aAsistenciaDeHijo);
check('mapea los dos registros', registros.length === 2);
check('traduce profesional_nombre', registros[0].profesionalNombre === 'Luis Gómez');
check('etiqueta legible del estado', registros[0].etiquetaEstado === 'Tarde');
check('sin profesional → null', aAsistenciaDeHijo({ id: 1, fecha: '2026-09-01', estado: 'AUSENTE' }).profesionalNombre === null);

console.log('\n── aDestinatarioLectura(): estado de lectura (BL-46) ──');

const filaLectura = aDestinatarioLectura({
    id: 12, destinatario_id: 30, destinatario_type: 'padre',
    destinatario_nombre: 'Luisa Peña', leido: 1,
});
check('traduce el id del mensaje', filaLectura.mensajeId === 12);
check('traduce destinatario y tipo', filaLectura.destinatarioId === 30 && filaLectura.destinatarioType === 'padre');
check('traduce el nombre', filaLectura.nombre === 'Luisa Peña');
check('interpreta el estado de lectura', filaLectura.haLeido() === true);
check('sin nombre resuelto queda "Desconocido"',
    aDestinatarioLectura({ id: 1, destinatario_id: 2, destinatario_type: 'padre', leido: 0 }).nombre === 'Desconocido');
check('la lista del endpoint viene pelada y comoLista la respeta',
    comoLista([{ id: 1, leido: 0 }, { id: 2, leido: 1 }]).map(aDestinatarioLectura).length === 2);

console.log('\n── aNovedad(): avisos de novedades (BL-50) ──');

const novedadAgenda = aNovedad({
    tipo: 'agenda', clave: 'agenda:100:2026-09-09',
    titulo: 'Agenda diaria de Mateo', texto: 'Ya puedes ver la agenda del miércoles 9 de septiembre de 2026',
    fecha: '2026-09-09 15:00:00', referencia_id: 7, estudiante_id: 100, estudiante_nombre: 'Mateo Peña Ruiz',
});
check('traduce el tipo y la clave', novedadAgenda.tipo === 'agenda' && novedadAgenda.clave === 'agenda:100:2026-09-09');
check('traduce el identificador de referencia', novedadAgenda.referenciaId === 7);
check('traduce el estudiante', novedadAgenda.estudianteId === 100 && novedadAgenda.estudianteNombre === 'Mateo Peña Ruiz');
check('sabe a qué pantalla lleva', novedadAgenda.rutaDestino() === 'agenda-diaria-hijo');

const novedadMensaje = aNovedad({
    tipo: 'mensaje', clave: 'mensaje:12', titulo: 'Mensaje de Marta', texto: 'Salida',
    fecha: '2026-09-09 16:00:00', referencia_id: 12, estudiante_id: null, estudiante_nombre: null,
});
check('un mensaje no trae estudiante', novedadMensaje.estudianteId === null);

console.log(`\n════════════════════\nResultado: ${ok} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
