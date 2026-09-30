/**
 * Jardin — Un jardín cliente de AgendaKids, visto por soporte (BL-74).
 *
 * Sólo existe en la web: dar de alta jardines es trabajo de soporte, desde el
 * computador. Las reglas del alta repiten con las MISMAS palabras las de
 * soporte_alta_jardin.php, para avisar antes de enviar; el servidor vuelve a
 * comprobarlo todo.
 */

/** Documentos de una persona adulta (el servidor acepta los mismos). */
export const TIPOS_DOCUMENTO_DIRECTOR = [
    { valor: 'CC',  etiqueta: 'Cédula de ciudadanía' },
    { valor: 'CE',  etiqueta: 'Cédula de extranjería' },
    { valor: 'PA',  etiqueta: 'Pasaporte' },
    { valor: 'PPT', etiqueta: 'Permiso por Protección Temporal' },
];

export const MIN_CONTRASENA_DIRECTOR = 8;

export class Jardin {
    constructor({ id, nombre, direccion = null, correo = null, creado = null, directores = [],
                  alumnos = 0, grupos = 0, profesionales = 0, familias = 0, logo = null, logoEsperado = null }) {
        this.id            = id;
        this.nombre        = nombre;
        this.direccion     = direccion;
        this.correo        = correo;
        this.creado        = creado;
        this.directores    = directores;     // [{ nombre, email }]
        this.alumnos       = alumnos;
        this.grupos        = grupos;
        this.profesionales = profesionales;
        this.familias      = familias;
        this.logo          = logo;           // "colegio_7.png" o null si aún no tiene
        this.logoEsperado  = logoEsperado;   // con qué nombre subirlo
    }
}

/** Lo que soporte escribe en el formulario de alta. */
export class NuevoJardin {
    constructor({ nombre = '', direccion = '', correo = '',
                  director = { nombres: '', apellidos: '', tipoDocumento: 'CC', documento: '', email: '', telefono: '', password: '' } } = {}) {
        this.nombre    = nombre;
        this.direccion = direccion;
        this.correo    = correo;
        this.director  = director;
    }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lo que se exige antes de dar de alta: el texto del primer error, o null si
 * está bien. Mismas palabras que el servidor.
 */
export function validarNuevoJardin(n) {
    const d = n?.director ?? {};
    const t = (x) => String(x ?? '').trim();
    if (!t(n?.nombre))                                         return 'El nombre del jardín es obligatorio.';
    if (t(n?.correo) && !CORREO.test(t(n.correo)))             return 'El correo del jardín no es válido.';
    if (!t(d.nombres) || !t(d.apellidos))                      return 'Los nombres y apellidos del director son obligatorios.';
    if (!TIPOS_DOCUMENTO_DIRECTOR.some(x => x.valor === d.tipoDocumento) || !t(d.documento))
                                                               return 'El tipo y el número de documento del director son obligatorios.';
    if (!CORREO.test(t(d.email)))                              return 'El correo del director no es válido.';
    if (String(d.password ?? '').length < MIN_CONTRASENA_DIRECTOR)
                                                               return `La contraseña inicial debe tener al menos ${MIN_CONTRASENA_DIRECTOR} caracteres.`;
    return null;
}

/** "2 alumnos · 1 grupo · 1 profesional · 1 familia", con singulares bien puestos. */
export function textoCifras(j) {
    const c = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
    return [c(j.alumnos, 'alumno', 'alumnos'), c(j.grupos, 'grupo', 'grupos'),
            c(j.profesionales, 'profesional', 'profesionales'), c(j.familias, 'familia', 'familias')].join(' · ');
}

/** Qué decir del logo: si ya está, y si no, con qué nombre subirlo (BL-75). */
export function textoLogo(j) {
    return j.logo ? `Logo: ${j.logo}` : `Sin logo. Súbalo como ${j.logoEsperado} en uploads/logos`;
}

/**
 * Una contraseña inicial para el director: 12 caracteres sin los que se
 * confunden al dictarlos (0/O, 1/l/I). Se la entrega soporte al director.
 */
export function generarContrasena(aleatorio = (n) => crypto.getRandomValues(new Uint32Array(n))) {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return Array.from(aleatorio(12), v => letras[v % letras.length]).join('');
}
