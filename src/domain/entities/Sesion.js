/**
 * Sesion — Usuario autenticado.
 * Espejo de: util/UserSessionManager.kt + data.LoggedInUser
 *
 * Los tres roles del sistema. La app Android los compara como string
 * ("director" / "profesional" / "padre"); aquí se centralizan.
 */
export const Rol = {
    DIRECTOR:    'director',
    PROFESIONAL: 'profesional',
    PADRE:       'padre',
};

export class Sesion {
    constructor({ userType, userId, colegioId, nombres, apellidos, email = null, token = null }) {
        // El token lo emite login.php (BL-22) y viaja en cada petición como
        // `Authorization: Bearer`. Es lo único que prueba quién eres.
        this.token     = token;
        this.userType  = userType;
        this.userId    = userId;
        this.colegioId = colegioId;
        this.nombres   = nombres;
        this.apellidos = apellidos;
        this.email     = email;
    }

    /** Espejo de UserSessionManager.isLoggedIn() */
    get estaAutenticada() {
        return Boolean(this.userType && this.userId && this.token);
    }

    get nombreCompleto() {
        return [this.nombres, this.apellidos].filter(Boolean).join(' ');
    }

    esDirector()    { return this.userType === Rol.DIRECTOR; }
    esProfesional() { return this.userType === Rol.PROFESIONAL; }
    esPadre()       { return this.userType === Rol.PADRE; }
}
