/**
 * MarcarCircularLeida — La familia abrió una circular (BL-70).
 * Espejo de: CircularesViewModel.marcarLeida()
 *
 * Sólo se llama si la circular figura como no leída, que sólo le pasa al
 * acudiente: el acuse es de las familias. Igual que con los mensajes, si falla
 * no interrumpe la lectura; la familia ya la está viendo.
 */
export class MarcarCircularLeida {
    constructor({ circularRepository }) {
        this.circularRepository = circularRepository;
    }

    async ejecutar(circular) {
        if (!circular || circular.leida !== false) return false;
        try {
            await this.circularRepository.marcarLeida(circular.id);
            return true;
        } catch (e) {
            console.error('No se pudo marcar la circular como leída:', e);
            return false;
        }
    }
}
