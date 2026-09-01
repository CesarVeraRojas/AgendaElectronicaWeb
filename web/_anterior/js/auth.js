/**
 * auth.js — Session management
 * Mirrors: util/UserSessionManager.kt
 *
 * Android uses an in-memory object (Kotlin object singleton).
 * Web uses localStorage so the session survives page reloads,
 * equivalent to SharedPreferences in Android.
 */

const SESSION_KEY = 'agenda_session';

export const Auth = {

    /**
     * Persists user data after a successful login.
     * Mirrors: UserSessionManager.saveSession()
     */
    saveSession({ userType, userId, colegioId, nombres, apellidos }) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            userType,
            userId,
            colegioId,
            nombres,
            apellidos,
        }));
    },

    /**
     * Reads the current session from storage.
     * Returns null if no session exists.
     */
    getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    /**
     * Clears all session data.
     * Mirrors: UserSessionManager.clearSession()
     */
    clearSession() {
        localStorage.removeItem(SESSION_KEY);
    },

    /**
     * Returns true if a valid session exists.
     * Mirrors: UserSessionManager.isLoggedIn()
     */
    isLoggedIn() {
        const s = this.getSession();
        return !!(s && s.userType && s.userId);
    },

    // Property accessors — mirror the individual properties on UserSessionManager
    get userType()  { return this.getSession()?.userType  ?? null; },
    get userId()    { return this.getSession()?.userId    ?? null; },
    get colegioId() { return this.getSession()?.colegioId ?? null; },
    get nombres()   { return this.getSession()?.nombres   ?? null; },
    get apellidos() { return this.getSession()?.apellidos ?? null; },
};
