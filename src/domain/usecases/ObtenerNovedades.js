import { filtrarNoAvisadas, recortarClaves } from '../entities/Novedad.js';

/**
 * ObtenerNovedades — Qué hay de nuevo desde la última vez que se preguntó.
 *
 * La marca de tiempo la pone el servidor y aquí sólo se guarda tal cual: usar
 * el reloj del navegador haría que un equipo desajustado se saltara avisos o
 * los repitiera.
 */
export class ObtenerNovedades {
    constructor({ novedadRepository }) {
        this.novedadRepository = novedadRepository;
    }

    /** @returns {Promise<Novedad[]>} Sólo las que no se han avisado todavía. */
    async ejecutar() {
        const desde = this.novedadRepository.ultimaConsulta();
        const { ahora, novedades } = await this.novedadRepository.consultar(desde);

        const avisadas = this.novedadRepository.clavesAvisadas();
        const nuevas   = filtrarNoAvisadas(novedades, avisadas);

        if (ahora) this.novedadRepository.guardarUltimaConsulta(ahora);
        if (nuevas.length) {
            this.novedadRepository.guardarClavesAvisadas(
                recortarClaves([...avisadas, ...nuevas.map(n => n.clave)]),
            );
        }

        return nuevas;
    }

    /** Al cerrar sesión: lo que quede guardado es de otra persona. */
    olvidar() {
        this.novedadRepository.olvidar();
    }
}
