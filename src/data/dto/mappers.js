/**
 * mappers.js — Traducción entre el JSON del backend PHP y las entidades del dominio.
 *
 * Equivale a las anotaciones @SerializedName de Gson en Android: aísla al dominio
 * de los nombres snake_case del PHP. Si el backend cambia un nombre de campo,
 * sólo se toca este archivo.
 */
import { Sesion }                     from '../../domain/entities/Sesion.js';
import { Estudiante }                 from '../../domain/entities/Estudiante.js';
import { Grupo }                      from '../../domain/entities/Grupo.js';
import { Profesional }                from '../../domain/entities/Profesional.js';
import { Colegio }                    from '../../domain/entities/Colegio.js';
import { Observacion }                from '../../domain/entities/Observacion.js';
import { AsistenciaRegistrada }       from '../../domain/entities/Asistencia.js';
import { AgendaDiaria }               from '../../domain/entities/AgendaDiaria.js';
import { Mensaje, UsuarioMensaje, DestinatarioLectura } from '../../domain/entities/Mensaje.js';
import { Foto, FotosDeHijo }          from '../../domain/entities/Foto.js';
import { Padre }                      from '../../domain/entities/Padre.js';

/** Algunos endpoints devuelven listas, otros {data:[...]}; normaliza a array. */
export function comoLista(json) {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.estudiantes)) return json.estudiantes;

    // `respondWithSuccess($filas)` hace `array_merge(["success"=>true], $filas)`.
    // Cuando $filas es una lista, sus índices 0,1,2… sobreviven como claves y el
    // conjunto deja de ser un array PHP: json_encode escupe un OBJETO
    //     {"success":true,"0":{…},"1":{…}}
    // en vez de un array. Le pasa a listar_padres.php y a estudiantes.php;
    // listar_profesionales.php no, porque usa json_response($filas) directamente.
    if (json && typeof json === 'object') {
        const filas = Object.keys(json)
            .filter(k => /^\d+$/.test(k))
            .sort((a, b) => Number(a) - Number(b))
            .map(k => json[k]);
        if (filas.length) return filas;
    }
    return [];
}

export function aSesion(json) {
    const u = json?.user ?? {};
    return new Sesion({
        userType:  json?.user_type,
        userId:    u.id,
        colegioId: u.colegio_id ?? null,
        nombres:   u.nombres,
        apellidos: u.apellidos,
        email:     u.email ?? null,
    });
}

export function aEstudiante(j) {
    return new Estudiante({
        id:              j.id,
        nombres:         j.nombres,
        apellidos:       j.apellidos,
        colegioId:       j.colegio_id ?? null,
        // estudiantes.php devuelve la ficha completa; los endpoints por grupo
        // o por padre sólo el nombre, y entonces estos quedan en null.
        tipoDocumento:   j.tipo_documento ?? null,
        documento:       j.documento ?? null,
        fechaNacimiento: j.fecha_nacimiento ?? null,
        genero:          j.genero ?? null,
        direccion:       j.direccion ?? null,
        telefono:        j.telefono ?? null,
        email:           j.email ?? null,
    });
}

export function aPadre(j) {
    return new Padre({
        id:            j.id,
        tipoDocumento: j.tipo_documento ?? null,
        documento:     j.documento ?? null,
        nombres:       j.nombres ?? '',
        apellidos:     j.apellidos ?? '',
        parentesco:    j.parentesco ?? null,
        telefono:      j.telefono ?? null,
        email:         j.email ?? null,
        direccion:     j.direccion ?? null,
    });
}

export function aGrupo(j) {
    return new Grupo({
        id:          j.id,
        nombreGrupo: j.nombre_grupo,
        descripcion: j.descripcion ?? null,
    });
}

export function aProfesional(j) {
    return new Profesional({
        id:            j.id,
        nombres:       j.nombres,
        apellidos:     j.apellidos,
        email:         j.email ?? null,
        documento:     j.documento ?? null,
        tipoDocumento: j.tipo_documento ?? null,
        telefono:      j.telefono ?? null,
    });
}

export function aColegio(j) {
    return new Colegio({
        nombre:    j?.nombre ?? '',
        direccion: j?.direccion ?? '',
    });
}

export function aObservacion(j) {
    return new Observacion({
        id:                j.id,
        observacion:       j.observacion,
        fecha:             j.fecha,
        tipo:              j.tipo ?? null,
        profesionalNombre: j.profesional_nombre ?? null,
    });
}

export function aAsistenciaDeHijo(j) {
    return new AsistenciaRegistrada({
        id:                j.id,
        fecha:             j.fecha,
        estado:            j.estado,
        profesionalNombre: j.profesional_nombre ?? null,
    });
}

/**
 * El backend puede devolver estado_animo como array o como cadena separada
 * por comas; se normaliza siempre a array.
 */
function aListaEstadoAnimo(valor) {
    if (Array.isArray(valor)) return valor;
    if (typeof valor === 'string' && valor.trim()) {
        return valor.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

export function aAgendaDiaria(j) {
    if (!j) return null;
    return new AgendaDiaria({
        estudianteId:                 j.estudiante_id,
        profesionalId:                j.profesional_id,
        fecha:                        j.fecha,
        alimentacionSnackAM:          j.alimentacion_snack_am ?? null,
        alimentacionAlmuerzo:         j.alimentacion_almuerzo ?? null,
        alimentacionSnackPM:          j.alimentacion_snack_pm ?? null,
        controlEsfinteresMiccion:     j.control_esfinteres_miccion ?? null,
        controlEsfinteresDeposicion:  j.control_esfinteres_deposicion ?? null,
        controlEsfinteresCambioPanal: j.control_esfinteres_cambio_panal ?? null,
        estadoAnimo:                  aListaEstadoAnimo(j.estado_animo),
        desarrolloCompetencias:       j.desarrollo_competencias ?? null,
        enLaClase:                    j.en_la_clase ?? null,
        rolSocial:                    j.rol_social ?? null,
        comentariosDelDia:            j.comentarios_del_dia ?? null,
    });
}

export function desdeAgendaDiaria(a) {
    return {
        estudiante_id:                   a.estudianteId,
        profesional_id:                  a.profesionalId,
        fecha:                           a.fecha,
        alimentacion_snack_am:           a.alimentacionSnackAM,
        alimentacion_almuerzo:           a.alimentacionAlmuerzo,
        alimentacion_snack_pm:           a.alimentacionSnackPM,
        control_esfinteres_miccion:      a.controlEsfinteresMiccion,
        control_esfinteres_deposicion:   a.controlEsfinteresDeposicion,
        control_esfinteres_cambio_panal: a.controlEsfinteresCambioPanal,
        estado_animo:                    a.estadoAnimo,
        desarrollo_competencias:         a.desarrolloCompetencias,
        en_la_clase:                     a.enLaClase,
        rol_social:                      a.rolSocial,
        comentarios_del_dia:             a.comentariosDelDia,
    };
}

export function aMensaje(j) {
    return new Mensaje({
        id:                 j.id,
        remitenteId:        j.remitente_id,
        remitenteType:      j.remitente_type,
        destinatarioId:     j.destinatario_id,
        destinatarioType:   j.destinatario_type,
        asunto:             j.asunto ?? '',
        mensaje:            j.mensaje ?? '',
        fechaEnvio:         j.fecha_envio,
        leido:              j.leido,
        remitenteNombre:    j.remitente_nombre ?? null,
        destinatarioNombre: j.destinatario_nombre ?? null,
        adjuntoUrl:         j.adjunto_url ?? null,
    });
}

export function aDestinatarioLectura(j) {
    return new DestinatarioLectura({
        mensajeId:        j.id,
        destinatarioId:   j.destinatario_id,
        destinatarioType: j.destinatario_type,
        nombre:           j.destinatario_nombre ?? 'Desconocido',
        leido:            j.leido,
    });
}

export function aUsuarioMensaje(j) {
    return new UsuarioMensaje({
        id:          j.id,
        userType:    j.user_type,
        displayName: j.display_name,
    });
}

export function aFoto(j) {
    return new Foto({
        id:          j.id,
        fotoUrl:     j.foto_url,
        fechaSubida: j.fecha_subida,
    });
}

export function aFotosDeHijo(j) {
    return new FotosDeHijo({
        hijoId:     j.hijo_id,
        nombreHijo: j.nombre_hijo,
        fotos:      (j.fotos ?? []).map(aFoto),
    });
}

export function desdeNuevoEstudiante(e) {
    return {
        colegio_id:       e.colegioId,
        tipo_documento:   e.tipoDocumento,
        documento:        e.documento,
        nombres:          e.nombres,
        apellidos:        e.apellidos,
        fecha_nacimiento: e.fechaNacimiento,
        genero:           e.genero,
        direccion:        e.direccion,
        telefono:         e.telefono,
        email:            e.email,
    };
}

export function desdeAcudiente(a) {
    return {
        tipo_documento: a.tipoDocumento,
        documento:      a.documento,
        nombres:        a.nombres,
        apellidos:      a.apellidos,
        parentesco:     a.parentesco,
        telefono:       a.telefono,
        email:          a.email,
        direccion:      a.direccion,
        password:       a.password,
    };
}

export function desdeProfesional(p) {
    return {
        colegio_id:     p.colegioId,
        tipo_documento: p.tipoDocumento,
        documento:      p.documento,
        nombres:        p.nombres,
        apellidos:      p.apellidos,
        telefono:       p.telefono,
        email:          p.email,
        password:       p.password,
    };
}


/**
 * Traducción de los diffs de actualización: nombre de dominio → columna del PHP.
 * Se listan sólo los campos que cada endpoint declara actualizables, así un
 * campo de más en el formulario nunca llega al backend.
 */
const COLUMNAS_PADRE = {
    tipoDocumento: 'tipo_documento', documento: 'documento',
    nombres: 'nombres', apellidos: 'apellidos', parentesco: 'parentesco',
    telefono: 'telefono', email: 'email', direccion: 'direccion',
};

const COLUMNAS_PROFESIONAL = {
    tipoDocumento: 'tipo_documento', documento: 'documento',
    nombres: 'nombres', apellidos: 'apellidos',
    telefono: 'telefono', email: 'email',
};

const COLUMNAS_ESTUDIANTE = {
    tipoDocumento: 'tipo_documento', documento: 'documento',
    nombres: 'nombres', apellidos: 'apellidos',
    fechaNacimiento: 'fecha_nacimiento', genero: 'genero',
    direccion: 'direccion', telefono: 'telefono', email: 'email',
};

function aColumnas(cambios, columnas) {
    const salida = {};
    for (const [campo, valor] of Object.entries(cambios)) {
        const columna = columnas[campo];
        if (columna) salida[columna] = valor;
    }
    return salida;
}

export const desdeCambiosPadre       = (c) => aColumnas(c, COLUMNAS_PADRE);
export const desdeCambiosProfesional = (c) => aColumnas(c, COLUMNAS_PROFESIONAL);
export const desdeCambiosEstudiante  = (c) => aColumnas(c, COLUMNAS_ESTUDIANTE);
