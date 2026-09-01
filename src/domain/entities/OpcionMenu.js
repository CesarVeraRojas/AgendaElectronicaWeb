/**
 * OpcionMenu — Espejo de la data class MenuOption de MenuScreen.kt.
 * `color` es un rol del tema (primary/secondary/tertiary), no un valor hexadecimal:
 * el dominio no conoce colores concretos.
 */
export class OpcionMenu {
    constructor({ texto, icono, ruta, color }) {
        this.texto = texto;
        this.icono = icono;
        this.ruta  = ruta;
        this.color = color;
    }
}
