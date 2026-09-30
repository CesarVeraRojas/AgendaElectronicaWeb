/**
 * Evento — El calendario de eventos del jardín (BL-76).
 * Espejo de: data/Eventos.kt
 *
 * Las reglas de lectura —cómo se escribe la fecha de un evento, cómo se agrupan
 * los próximos por mes, cómo se arma la cuadrícula del mes, qué se exige al
 * crear— viven duplicadas A PROPÓSITO aquí y en Android, fijadas con los mismos
 * textos en tests/eventos.test.mjs y EventosTest.kt.
 *
 * Fechas "YYYY-MM-DD" y horas "HH:MM" del jardín, sin zona; los cálculos van con
 * Date.UTC para que ningún huso mueva un día (lección de BL-57).
 */

export const MAX_TITULO_EVENTO = 150;
export const MAX_LUGAR_EVENTO = 150;
export const MAX_DESCRIPCION_EVENTO = 2000;
export const MAX_DIAS_EVENTO = 60;

/** La paleta del .ini → el color que se pinta. Uno desconocido, gris. */
export const COLORES_EVENTO = {
    azul: '#0288D1', rojo: '#E53935', verde: '#43A047', amarillo: '#F9A825',
    morado: '#8E24AA', naranja: '#FB8C00', rosado: '#D81B60', gris: '#757575',
};
export const colorDeEvento = (nombre) => COLORES_EVENTO[nombre] ?? COLORES_EVENTO.gris;

const DIAS  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export class Evento {
    constructor({ id, tipo, tipoNombre, color = 'gris', titulo, descripcion = '', lugar = null,
                  fechaInicio, fechaFin, horaInicio = null, horaFin = null, grupoId = null, grupoNombre = null,
                  autor = null, puedeEditar = false }) {
        Object.assign(this, { id, tipo, tipoNombre, color, titulo, descripcion, lugar, fechaInicio,
                              fechaFin: fechaFin ?? fechaInicio, horaInicio, horaFin, grupoId, grupoNombre,
                              autor, puedeEditar });
    }
    get todoElDia() { return !this.horaInicio; }
    get variosDias() { return this.fechaFin !== this.fechaInicio; }
}

export class CalendarioDeEventos {
    constructor({ hoy = null, tipos = [], puedeCrear = false, gruposParaCrear = [], eventos = [] }) {
        Object.assign(this, { hoy, tipos, puedeCrear, gruposParaCrear, eventos });
    }
}

/** Lo que escribe quien crea o edita. */
export class NuevoEvento {
    constructor({ eventoId = null, tipo = '', titulo = '', descripcion = '', lugar = '', fechaInicio = '',
                  fechaFin = '', horaInicio = '', horaFin = '', grupoId = null } = {}) {
        Object.assign(this, { eventoId, tipo, titulo, descripcion, lugar, fechaInicio, fechaFin, horaInicio, horaFin, grupoId });
    }
}

const aUtc = (f) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10));
const deUtc = (ms) => new Date(ms).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((aUtc(b) - aUtc(a)) / 86400000);
export const sumarDias = (f, n) => deUtc(aUtc(f) + n * 86400000);

/** "18:30" → "6:30 p. m.", como en el servidor. */
export function horaLegible(hhmm) {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** "Hoy", "Mañana" o "Viernes 2 de octubre" (con el año si no es el de hoy). */
export function diaLegible(fecha, hoy) {
    if (hoy) {
        const d = diasEntre(hoy, fecha);
        if (d === 0) return 'Hoy';
        if (d === 1) return 'Mañana';
    }
    const x = new Date(aUtc(fecha));
    let t = `${mayus(DIAS[x.getUTCDay()])} ${x.getUTCDate()} de ${MESES[x.getUTCMonth()]}`;
    if (hoy && hoy.slice(0, 4) !== fecha.slice(0, 4)) t += ` de ${fecha.slice(0, 4)}`;
    return t;
}

/**
 * Cuándo es, en una línea:
 *   "Hoy · 6:00 p. m. – 8:00 p. m."   "Mañana · Todo el día"
 *   "Del lunes 5 al viernes 9 de octubre"   (varios días)
 */
export function textoFechaEvento(ev, hoy) {
    if (ev.fechaFin && ev.fechaFin !== ev.fechaInicio) {
        const a = new Date(aUtc(ev.fechaInicio)), b = new Date(aUtc(ev.fechaFin));
        const mismoMes = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
        const inicio = `${DIAS[a.getUTCDay()]} ${a.getUTCDate()}` + (mismoMes ? '' : ` de ${MESES[a.getUTCMonth()]}`);
        return `Del ${inicio} al ${DIAS[b.getUTCDay()]} ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]}`;
    }
    const cuando = !ev.horaInicio ? 'Todo el día'
        : ev.horaFin ? `${horaLegible(ev.horaInicio)} – ${horaLegible(ev.horaFin)}` : horaLegible(ev.horaInicio);
    return `${diaLegible(ev.fechaInicio, hoy)} · ${cuando}`;
}

/** Para quién: "Todo el jardín" o "Grupo Rojo". */
export const textoParaQuien = (ev) => ev.grupoNombre ? `Grupo ${ev.grupoNombre}` : 'Todo el jardín';

/** Los próximos, agrupados por mes: [{ mes: 'Octubre de 2026', eventos }]. Ya vienen en orden. */
export function agruparPorMes(eventos) {
    const grupos = [];
    for (const ev of eventos) {
        const mes = `${mayus(MESES[+ev.fechaInicio.slice(5, 7) - 1])} de ${ev.fechaInicio.slice(0, 4)}`;
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.mes === mes) ultimo.eventos.push(ev);
        else grupos.push({ mes, eventos: [ev] });
    }
    return grupos;
}

/** El primero que no ha terminado, para la tarjeta del menú; null si no hay. */
export function proximoEvento(eventos, hoy) {
    return eventos.find(ev => (ev.fechaFin ?? ev.fechaInicio) >= hoy) ?? null;
}

/**
 * La cuadrícula del mes, de lunes a domingo: semanas de 7 días, cada uno con
 * { fecha, delMes, esHoy, eventos } (los que lo tocan, incluidos los de varios días).
 */
export function semanasDelMes(anio, mes, eventos, hoy) {
    const primero = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const dow = new Date(aUtc(primero)).getUTCDay();            // 0 = domingo
    let dia = sumarDias(primero, -((dow + 6) % 7));              // el lunes de esa semana
    const semanas = [];
    do {
        const semana = [];
        for (let i = 0; i < 7; i++) {
            semana.push({
                fecha: dia,
                delMes: +dia.slice(5, 7) === mes,
                esHoy: dia === hoy,
                eventos: eventos.filter(ev => ev.fechaInicio <= dia && (ev.fechaFin ?? ev.fechaInicio) >= dia),
            });
            dia = sumarDias(dia, 1);
        }
        semanas.push(semana);
    } while (+dia.slice(5, 7) === mes);
    return semanas;
}

/** "Octubre de 2026". */
export const tituloDelMes = (anio, mes) => `${mayus(MESES[mes - 1])} de ${anio}`;

/** Qué decir sin eventos. */
export const textoSinEventos = (puedeCrear) => puedeCrear
    ? 'No hay eventos próximos. Toque "Nuevo evento" para crear el primero.'
    : 'No hay eventos próximos en el calendario del jardín.';

/** El aviso antes de cancelar. */
export const TEXTO_CONFIRMAR_CANCELAR_EVENTO =
    'Las familias recibirán un aviso de que el evento se canceló y dejará de verse en el calendario.';

/**
 * Lo que se exige antes de guardar: el texto del primer error o null. Las
 * mismas palabras que guardar_evento.php.
 */
export function validarEvento(n, hoy, esProfesional = false) {
    const t = (x) => String(x ?? '').trim();
    const largo = (x) => [...t(x)].length;
    const fecha = /^\d{4}-\d{2}-\d{2}$/, hora = /^([01]\d|2[0-3]):[0-5]\d$/;
    const inicio = t(n.fechaInicio), fin = t(n.fechaFin) || inicio;
    if (!t(n.titulo))                                        return 'El título es obligatorio.';
    if (largo(n.titulo) > MAX_TITULO_EVENTO)                 return `El título no puede pasar de ${MAX_TITULO_EVENTO} caracteres.`;
    if (!t(n.tipo))                                          return 'Elija el tipo de evento.';
    if (largo(n.lugar) > MAX_LUGAR_EVENTO)                   return `El lugar no puede pasar de ${MAX_LUGAR_EVENTO} caracteres.`;
    if (largo(n.descripcion) > MAX_DESCRIPCION_EVENTO)       return `La descripción no puede pasar de ${MAX_DESCRIPCION_EVENTO} caracteres.`;
    if (!fecha.test(inicio) || !fecha.test(fin) || isNaN(aUtc(inicio)) || deUtc(aUtc(inicio)) !== inicio || deUtc(aUtc(fin)) !== fin)
                                                             return 'La fecha del evento no es válida.';
    if (fin < inicio)                                        return 'La fecha de fin no puede ser anterior a la de inicio.';
    if (diasEntre(inicio, fin) > MAX_DIAS_EVENTO)            return `Un evento no puede durar más de ${MAX_DIAS_EVENTO} días.`;
    if (hoy && fin < hoy)                                    return 'La fecha del evento ya pasó.';
    if (!t(n.horaInicio) && t(n.horaFin))                    return 'Indique la hora de inicio.';
    if ((t(n.horaInicio) && !hora.test(t(n.horaInicio))) || (t(n.horaFin) && !hora.test(t(n.horaFin))))
                                                             return 'La hora no es válida.';
    if (t(n.horaFin) && inicio === fin && t(n.horaFin) <= t(n.horaInicio))
                                                             return 'La hora de fin debe ser posterior a la de inicio.';
    if (esProfesional && !n.grupoId)                         return 'Elija uno de sus grupos: sólo la dirección crea eventos para todo el jardín.';
    return null;
}

/**
 * El evento como archivo .ics ("Agregar a mi calendario"): lo abren el
 * calendario del teléfono y del computador sin pedir permisos. Las horas del
 * jardín (Colombia, UTC−5 todo el año) se pasan a UTC.
 */
export function generarIcs(ev, ahora = new Date()) {
    const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const compacta = (f) => f.replace(/-/g, '');
    const utc = (f, h) => {
        const [hh, mm] = h.split(':').map(Number);
        return new Date(aUtc(f) + (hh + 5) * 3600000 + mm * 60000).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    };
    const fin = ev.fechaFin ?? ev.fechaInicio;
    const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AgendaKids//Calendario//ES', 'BEGIN:VEVENT',
        `UID:evento-${ev.id}@agendakids`,
        `DTSTAMP:${ahora.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`];
    if (!ev.horaInicio) {
        lineas.push(`DTSTART;VALUE=DATE:${compacta(ev.fechaInicio)}`, `DTEND;VALUE=DATE:${compacta(sumarDias(fin, 1))}`);
    } else {
        lineas.push(`DTSTART:${utc(ev.fechaInicio, ev.horaInicio)}`,
                    `DTEND:${utc(fin, ev.horaFin || `${String(Math.min(+ev.horaInicio.slice(0, 2) + 1, 23)).padStart(2, '0')}:${ev.horaInicio.slice(3)}`)}`);
    }
    lineas.push(`SUMMARY:${esc(ev.titulo)}`);
    if (ev.lugar) lineas.push(`LOCATION:${esc(ev.lugar)}`);
    if (ev.descripcion) lineas.push(`DESCRIPTION:${esc(ev.descripcion)}`);
    lineas.push('END:VEVENT', 'END:VCALENDAR');
    return lineas.join('\r\n') + '\r\n';
}
