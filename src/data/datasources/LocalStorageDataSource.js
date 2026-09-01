/**
 * LocalStorageDataSource — Envoltorio sobre localStorage.
 * Equivalente web de SharedPreferences.
 *
 * localStorage puede lanzar (modo privado, cookies bloqueadas), así que todo
 * va dentro de try/catch y degrada a memoria en vez de tumbar la aplicación.
 */
export class LocalStorageDataSource {
    constructor() {
        this._memoria = new Map();   // respaldo si localStorage no está disponible
    }

    leer(clave) {
        try {
            const bruto = localStorage.getItem(clave);
            return bruto ? JSON.parse(bruto) : null;
        } catch {
            return this._memoria.get(clave) ?? null;
        }
    }

    escribir(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch {
            this._memoria.set(clave, valor);
        }
    }

    borrar(clave) {
        try {
            localStorage.removeItem(clave);
        } catch {
            this._memoria.delete(clave);
        }
    }
}
