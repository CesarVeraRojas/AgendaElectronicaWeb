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
    constructor({ userType, userId, colegioId, nombres, apellidos, email = null }) {
        this.userType  = userType;
        this.userId    = userId;
        this.colegioId = colegioId;
        this.nombres   = nombres;
        this.apellidos = apellidos;
        this.email     = email;
    }

    /** Espejo de UserSessionManager.isLoggedIn() */
    get estaAutenticada() {
        return Boolean(this.userType && this.userId);
    }

    get nombreCompleto() {
        return [this.nombres, this.apellidos].filter(Boolean).join(' ');
    }

    esDirector()    { return this.userType === Rol.DIRECTOR; }
    esProfesional() { return this.userType === Rol.PROFESIONAL; }
    esPadre()       { return this.userType === Rol.PADRE; }
}
