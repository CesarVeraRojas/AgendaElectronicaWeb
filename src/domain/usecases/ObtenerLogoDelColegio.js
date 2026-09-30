/**
 * ObtenerLogoDelColegio — El logo del jardín, para el menú (BL-75).
 * Espejo de: MenuViewModel.cargarLogo()
 *
 * Decisión del usuario: en el login SIEMPRE el de AgendaKids (todavía no se
 * sabe de qué jardín es quien entra); ya dentro, el del jardín, si soporte lo
 * subió. Sin logo, o si falla la consulta, se queda el de AgendaKids: un logo
 * no puede estropear el menú.
 *
 * Se recuerda durante la sesión, para que al volver al menú no parpadee el de
 * AgendaKids antes de cambiar. La clave es el usuario: si entra otro, se pide de
 * nuevo.
 */
export const LOGO_AGENDAKIDS = 'assets/agenda_kids.jpeg';

export class ObtenerLogoDelColegio {
    constructor({ colegioRepository }) {
        this.colegioRepository = colegioRepository;
        this.recordado = null;   // { clave, url }
    }

    /** El logo ya conocido para esta sesión, o el de AgendaKids. Sin red. */
    inmediato(sesion) {
        const r = this.recordado;
        return (r && r.clave === claveDe(sesion) && r.url) ? r.url : LOGO_AGENDAKIDS;
    }

    /** Pregunta al servidor. Devuelve la URL del logo o el de AgendaKids; nunca lanza. */
    async ejecutar(sesion) {
        try {
            const url = await this.colegioRepository.obtenerLogo();
            this.recordado = { clave: claveDe(sesion), url };
            return url ?? LOGO_AGENDAKIDS;
        } catch (e) {
            return this.inmediato(sesion);
        }
    }
}

function claveDe(sesion) {
    return sesion ? `${sesion.userType}:${sesion.userId}` : '';
}
