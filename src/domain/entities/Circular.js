/**
 * Circular — Comunicación oficial del jardín (BL-70).
 * Espejo de: data/Circulares.kt
 *
 * Una circular no es un mensaje: la publica el director, a todo el colegio o a
 * un grupo, no admite respuestas y pertenece al colegio, no a una lista de
 * destinatarios. Quien entra después la ve igual.
 *
 * Las reglas de lectura —cómo se dice a quién va, el acuse, qué se dice cuando
 * no hay nada, qué se exige al publicar— viven duplicadas A PROPÓSITO aquí y en
 * Android, fijadas con los mismos textos en tests/circulares.test.mjs y en
 * CircularesTest.kt. Si se cambia una palabra en un lado, la prueba del otro lo
 * dice.
 */

/** Los mismos topes que publicar_circular.php. */
export const MAX_TITULO = 200;
export const MAX_TEXTO  = 5000;

/** Los tipos que acepta el servidor para el adjunto (tipos_de_adjunto_permitidos). */
export const TIPOS_DE_ADJUNTO = 'application/pdf,image/jpeg,image/png,image/gif,image/webp';

export class Circular {
    constructor({
        id, titulo, texto = '', adjuntoUrl = null, adjuntoNombre = null, adjuntoTipo = null,
        grupoId = null, grupoNombre = null, fechaPublicacion = null, dia = null, publicadaPor = null,
        leida = null, totalDestinatarios = null, totalLeidas = null,
    }) {
        this.id                 = id;
        this.titulo             = titulo;
        this.texto              = texto ?? '';
        this.adjuntoUrl         = adjuntoUrl;
        this.adjuntoNombre      = adjuntoNombre;
        this.adjuntoTipo        = adjuntoTipo;        // 'pdf' | 'imagen' | null
        this.grupoId            = grupoId;            // null = todo el colegio
        this.grupoNombre        = grupoNombre;
        this.fechaPublicacion   = fechaPublicacion;   // "2026-09-27 21:30:00", hora de Colombia
        this.dia                = dia;                // "2026-09-27"
        this.publicadaPor       = publicadaPor;
        // Sólo para el acudiente: si ya la abrió. null para los demás roles.
        this.leida              = leida;
        // Sólo para el director: el acuse, contado en familias.
        this.totalDestinatarios = totalDestinatarios;
        this.totalLeidas        = totalLeidas;
    }

    get hora() {
        const m = String(this.fechaPublicacion ?? '').match(/\d{2}:\d{2}/);
        return m ? m[0] : '';
    }

    tieneAdjunto() {
        return Boolean(this.adjuntoUrl);
    }

    /** Para el acudiente: el punto de "sin leer". Los demás roles no llevan la cuenta. */
    estaSinLeer() {
        return this.leida === false;
    }
}

export class PaginaDeCirculares {
    constructor({ hoy = null, circulares = [], hayMas = false, siguiente = null }) {
        this.hoy        = hoy;
        this.circulares = circulares;
        this.hayMas     = hayMas;
        this.siguiente  = siguiente;
    }
}

/** Una familia destinataria, en el acuse del director. */
export class FamiliaLectora {
    constructor({ padreId, nombre, estudiantes = [], leida = false, leidaEn = null }) {
        this.padreId     = padreId;
        this.nombre      = nombre;
        this.estudiantes = estudiantes;
        this.leida       = leida;
        this.leidaEn     = leidaEn;
    }
}

export class LecturaDeCircular {
    constructor({ total = 0, leidas = 0, destinatarios = [] }) {
        this.total         = total;
        this.leidas        = leidas;
        this.destinatarios = destinatarios;
    }
}

/** Lo que escribe el director antes de publicar. */
export class NuevaCircular {
    constructor({ titulo = '', texto = '', grupoId = null, adjunto = null } = {}) {
        this.titulo  = titulo;
        this.texto   = texto;
        this.grupoId = grupoId;
        this.adjunto = adjunto;   // File | null
    }
}

/** A quién va: "Todo el colegio" o "Grupo Rojo". */
export function textoDestino(grupoNombre) {
    return grupoNombre ? `Grupo ${grupoNombre}` : 'Todo el colegio';
}

/**
 * El acuse, en familias y no en personas: una madre con dos hijos en el grupo es
 * una familia que tiene que leerla.
 */
export function textoAcuseCircular({ total, leidas }) {
    if (total <= 0)       return 'Ninguna familia la recibe todavía';
    if (leidas >= total)  return total === 1 ? 'Leída por la familia' : `Leída por todas las familias (${total})`;
    if (leidas <= 0)      return total === 1 ? 'La familia aún no la ha leído' : `Ninguna de las ${total} familias la ha leído`;
    return `Leída por ${leidas} de ${total} familias`;
}

/**
 * Qué decir cuando no hay ninguna. Al director se le dice cómo empezar; a los
 * demás, que no es un fallo.
 */
export function textoSinCirculares(esDirector) {
    return esDirector
        ? 'Todavía no has publicado ninguna circular. Toca "Nueva circular" para enviar la primera.'
        : 'El jardín todavía no ha publicado circulares.';
}

/** Cómo se llama el adjunto en pantalla: el nombre original o, sin él, su tipo. */
export function textoAdjunto(circular) {
    if (circular?.adjuntoNombre) return circular.adjuntoNombre;
    return circular?.adjuntoTipo === 'pdf' ? 'Documento PDF' : 'Imagen adjunta';
}

/**
 * Lo que se exige antes de publicar: lo mismo que comprueba el servidor, dicho
 * antes de subir un archivo de 10 MB para nada. Devuelve el texto del error o
 * null si está bien.
 */
export function validarCircular({ titulo = '', texto = '', tieneAdjunto = false }) {
    const t = String(titulo ?? '').trim();
    const x = String(texto ?? '').trim();
    if (!t)                              return 'El título es obligatorio.';
    if ([...t].length > MAX_TITULO)      return `El título no puede pasar de ${MAX_TITULO} caracteres.`;
    if ([...x].length > MAX_TEXTO)       return `El texto no puede pasar de ${MAX_TEXTO} caracteres.`;
    if (!x && !tieneAdjunto)             return 'La circular necesita un texto o un archivo adjunto.';
    return null;
}

/** El aviso antes de retirarla: qué pasa y que no hay vuelta atrás. */
export const TEXTO_CONFIRMAR_ELIMINAR_CIRCULAR =
    'Las familias dejarán de verla y se perderá el registro de quién la leyó. Esta acción no se puede deshacer.';

/** El acuse del director: primero quien falta por leerla, que es a quien hay que perseguir. */
export function ordenarFamilias(familias = []) {
    return [...familias.filter(f => !f.leida), ...familias.filter(f => f.leida)];
}

/** Añade una página a lo ya cargado sin repetir ninguna. */
export function juntarCirculares(cargadas, nuevas) {
    const vistas = new Set(cargadas.map(c => c.id));
    return cargadas.concat(nuevas.filter(c => !vistas.has(c.id)));
}

/** Lo cargado sin la circular recién retirada. */
export function sinCircular(circulares, id) {
    return circulares.filter(c => c.id !== id);
}

/** Lo cargado con esa circular ya leída, para quitar el punto sin volver a pedir la lista. */
export function marcarLeidaEnLista(circulares, id) {
    return circulares.map(c => (c.id === id && c.leida === false) ? new Circular({ ...c, leida: true }) : c);
}
