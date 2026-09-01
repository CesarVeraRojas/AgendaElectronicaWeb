import { OpcionMenu } from '../entities/OpcionMenu.js';
import { Rol }        from '../entities/Sesion.js';

/**
 * ObtenerMenuPorRol — Espejo exacto de la construcción de menuOptions en MenuScreen.kt.
 *
 * Reglas replicadas:
 *   director    → 4 opciones de administración + las 4 de profesional
 *   profesional → 4 opciones (Asistencia, Observaciones, Agenda Diaria, Fotos)
 *   padre       → 3 opciones (Agenda, Observaciones, Fotos de su hijo)
 *   todos       → Mensajes al final
 */
export class ObtenerMenuPorRol {
    ejecutar(sesion) {
        if (!sesion) return [];

        const opciones = [];
        const rol = sesion.userType;

        if (rol === Rol.DIRECTOR) {
            opciones.push(new OpcionMenu({ texto: 'Crear Estudiante',      icono: 'person_add',     ruta: 'crear-estudiante',          color: 'primary'   }));
            opciones.push(new OpcionMenu({ texto: 'Crear Grupo',           icono: 'group_add',      ruta: 'crear-grupo',               color: 'secondary' }));
            opciones.push(new OpcionMenu({ texto: 'Crear Profesional',     icono: 'badge',          ruta: 'crear-profesional',         color: 'tertiary'  }));
            opciones.push(new OpcionMenu({ texto: 'Asignar Prof. a Grupo', icono: 'assignment_ind', ruta: 'asignar-profesional-grupo', color: 'primary'   }));
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
        }

        opciones.push(new OpcionMenu({ texto: 'Mensajes', icono: 'email', ruta: 'mensajes', color: 'tertiary' }));

        return opciones;
    }

    /** MenuScreen.kt muestra el pie con datos del colegio sólo a padres y profesionales. */
    debeMostrarPieColegio(sesion) {
        return sesion?.userType === Rol.PADRE || sesion?.userType === Rol.PROFESIONAL;
    }
}
