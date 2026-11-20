/**
 * Cuenta — La cuenta de un director, profesional o acudiente, vista por
 * soporte (2026-11-20): para atender "no puedo entrar", restablecer la
 * contraseña y desactivar o reactivar el acceso.
 *
 * Sólo existe en la web, como todo lo de soporte. El servidor
 * (soporte_usuarios.php) no manda documento, teléfono ni nada de niños.
 */

export const MIN_LETRAS_BUSQUEDA = 3;

export const TIPOS_CUENTA = {
    director:    'Director(a)',
    profesional: 'Profesional',
    padre:       'Acudiente',
};

export class Cuenta {
    constructor({ tipo, id, nombre, email = '', jardines = [], activo = true, tieneContrasena = true,
                  ultimoIngreso = null, ultimaActividad = null, sesionesAbiertas = 0 }) {
        this.tipo             = tipo;              // 'director' | 'profesional' | 'padre'
        this.id               = id;
        this.nombre           = nombre;
        this.email            = email;
        this.jardines         = jardines;          // [{ id, nombre }]
        this.activo           = activo;
        this.tieneContrasena  = tieneContrasena;
        this.ultimoIngreso    = ultimoIngreso;     // 'AAAA-MM-DD HH:MM:SS' o null
        this.ultimaActividad  = ultimaActividad;
        this.sesionesAbiertas = sesionesAbiertas;
    }
}

/** Mismo texto que el servidor. */
export function validarBusqueda(q) {
    return String(q ?? '').trim().length < MIN_LETRAS_BUSQUEDA
        ? `Escriba al menos ${MIN_LETRAS_BUSQUEDA} letras para buscar.`
        : null;
}

export const textoTipo = (c) => TIPOS_CUENTA[c.tipo] ?? c.tipo;

/** "Happy Children" · "Happy Children, Arcoíris" · "Sin jardín". */
export function textoJardines(c) {
    return c.jardines.length ? c.jardines.map(j => j.nombre).join(', ') : 'Sin jardín';
}

/**
 * Lo primero que soporte necesita saber del estado de la cuenta, de lo más
 * grave a lo normal.
 */
export function estadoCuenta(c) {
    if (!c.activo)          return { texto: 'Desactivada: no puede entrar', aviso: true };
    if (!c.tieneContrasena) return { texto: 'Sin contraseña: todavía no puede entrar', aviso: true };
    return { texto: 'Activa', aviso: false };
}

/** "1 sesión abierta" · "3 sesiones abiertas" · "Sin sesiones abiertas". */
export function textoSesiones(c) {
    const n = c.sesionesAbiertas;
    if (!n) return 'Sin sesiones abiertas';
    return n === 1 ? '1 sesión abierta' : `${n} sesiones abiertas`;
}

/** Qué pasará, para la confirmación. */
export function textoConfirmarDesactivar(c) {
    const base = `${c.nombre} no podrá entrar a AgendaKids y se cerrarán sus sesiones abiertas. No se borra nada de lo que escribió o subió.`;
    return c.tipo === 'director'
        ? `${base} Si es el único director, nadie podrá administrar el jardín.`
        : base;
}
