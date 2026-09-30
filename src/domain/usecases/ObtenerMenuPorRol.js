import { OpcionMenu } from '../entities/OpcionMenu.js';
import { Rol }        from '../entities/Sesion.js';

/**
 * ObtenerMenuPorRol — Espejo exacto de la construcción de menuOptions en MenuScreen.kt.
 *
 * Reglas replicadas:
 *   director    → 4 opciones de administración + las 4 de profesional
 *   profesional → 4 opciones (Asistencia, Observaciones, Agenda Diaria, Fotos)
 *   padre       → 4 opciones (Agenda, Observaciones, Fotos y Asistencia de su hijo)
 *   todos       → Circulares y Mensajes al final
 */
export class ObtenerMenuPorRol {
    ejecutar(sesion) {
        if (!sesion) return [];

        const opciones = [];
        const rol = sesion.userType;

        // BL-74: soporte sólo da de alta jardines. No es de ningún jardín, así
        // que no tiene circulares ni mensajes.
        if (rol === Rol.SOPORTE) {
            return [new OpcionMenu({ texto: 'Jardines', icono: 'domain', ruta: 'jardines', color: 'primary' })];
        }

        if (rol === Rol.DIRECTOR) {
            opciones.push(new OpcionMenu({ texto: 'Crear Estudiante',      icono: 'person_add',     ruta: 'crear-estudiante',          color: 'primary'   }));
            opciones.push(new OpcionMenu({ texto: 'Crear Grupo',           icono: 'group_add',      ruta: 'crear-grupo',               color: 'secondary' }));
            opciones.push(new OpcionMenu({ texto: 'Crear Profesional',     icono: 'badge',          ruta: 'crear-profesional',         color: 'tertiary'  }));
            opciones.push(new OpcionMenu({ texto: 'Asignar Prof. a Grupo', icono: 'assignment_ind', ruta: 'asignar-profesional-grupo', color: 'primary'   }));
            opciones.push(new OpcionMenu({ texto: 'Actualizar Datos',      icono: 'manage_accounts', ruta: 'actualizar-datos',           color: 'secondary' }));
            // E13: los informes son sólo del director, como el resto de este bloque.
            opciones.push(new OpcionMenu({ texto: 'Informe Asistencia',    icono: 'assessment',     ruta: 'informe-asistencia',        color: 'tertiary'  }));
            // BL-61: ver y borrar las fotos de todo el colegio. Borrar es sólo del director.
            opciones.push(new OpcionMenu({ texto: 'Fotos del Colegio',     icono: 'photo_library',  ruta: 'fotos-colegio',             color: 'primary'   }));
        }

        if (rol === Rol.PROFESIONAL || rol === Rol.DIRECTOR) {
            opciones.push(new OpcionMenu({ texto: 'Asistencia',    icono: 'check_circle',   ruta: 'asistencia',    color: 'secondary' }));
            opciones.push(new OpcionMenu({ texto: 'Observaciones', icono: 'edit_note',      ruta: 'observaciones', color: 'tertiary'  }));
            opciones.push(new OpcionMenu({ texto: 'Agenda Diaria', icono: 'calendar_today', ruta: 'agenda-diaria', color: 'primary'   }));
            opciones.push(new OpcionMenu({ texto: 'Fotos',         icono: 'photo_camera',   ruta: 'fotos',         color: 'secondary' }));
        }

        if (rol === Rol.PADRE) {
            opciones.push(new OpcionMenu({ texto: 'Agenda Diaria', icono: 'calendar_today', ruta: 'agenda-diaria-hijo',  color: 'primary'   }));
            opciones.push(new OpcionMenu({ texto: 'Observaciones', icono: 'edit_note',      ruta: 'observaciones-hijo',  color: 'secondary' }));
            opciones.push(new OpcionMenu({ texto: 'Fotos',         icono: 'photo_camera',   ruta: 'fotos-hijo',          color: 'tertiary'  }));
            opciones.push(new OpcionMenu({ texto: 'Asistencia',    icono: 'check_circle',   ruta: 'asistencia-hijo',     color: 'primary'   }));
        }

        // BL-70: las circulares, para los tres roles. Publicar y retirar es sólo
        // del director, y eso lo decide el servidor, no el menú.
        // BL-76: el calendario de eventos, para los tres roles del jardín.
        opciones.push(new OpcionMenu({ texto: 'Eventos', icono: 'event', ruta: 'eventos', color: 'primary' }));
        opciones.push(new OpcionMenu({ texto: 'Circulares', icono: 'campaign', ruta: 'circulares', color: 'secondary' }));
        opciones.push(new OpcionMenu({ texto: 'Mensajes', icono: 'email', ruta: 'mensajes', color: 'tertiary' }));

        return opciones;
    }

    /** MenuScreen.kt muestra el pie con datos del colegio sólo a padres y profesionales. */
    debeMostrarPieColegio(sesion) {
        return sesion?.userType === Rol.PADRE || sesion?.userType === Rol.PROFESIONAL;
    }
}
