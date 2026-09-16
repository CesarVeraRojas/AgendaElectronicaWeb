import { mesAnterior, mesSiguiente } from './ObtenerAsistenciaDeHijo.js';

export { mesAnterior, mesSiguiente };

/**
 * ObtenerInformeAsistencia — Resumen de asistencia por grupo y mes (BL-55).
 * Espejo de: viewmodels/InformeAsistenciaViewModel.kt
 *
 * El trabajo de verdad lo hace el servidor: `informe_asistencia.php` devuelve
 * las cuentas ya hechas en una sola consulta. Antes de él, este resumen habría
 * obligado a bajarse todos los registros del mes y sumarlos en el cliente, dos
 * veces, una por aplicación.
 *
 * Sólo el director: el endpoint responde 403 a cualquier otro rol.
 */
export class ObtenerInformeAsistencia {
    constructor({ informeRepository, grupoRepository }) {
        this.informeRepository = informeRepository;
        this.grupoRepository   = grupoRepository;
    }

    /** @param {{anio:number, mes:number, grupoId:?number}} filtro */
    async ejecutar({ anio, mes, grupoId = null }) {
        return this.informeRepository.asistenciaPorGrupoYMes({ anio, mes, grupoId });
    }

    /** Los grupos del colegio, para el desplegable de la pantalla. */
    async gruposDelColegio(colegioId) {
        return this.grupoRepository.listarPorColegio(colegioId);
    }
}

/** ¿Este mes está por venir? No tiene sentido pedir un informe del futuro. */
export function esFuturo({ anio, mes }, hoy = new Date()) {
    const anioHoy = hoy.getFullYear();
    const mesHoy  = hoy.getMonth() + 1;
    return anio > anioHoy || (anio === anioHoy && mes > mesHoy);
}
