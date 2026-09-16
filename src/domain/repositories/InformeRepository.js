/**
 * Contrato de los informes del director (E13).
 * La implementación vive en data/repositories/InformeRepositoryImpl.js.
 */
export class InformeRepository {
    /**
     * @param {{anio:number, mes:number, grupoId:?number}} filtro
     * @returns {Promise<import('../entities/InformeAsistencia.js').InformeAsistencia>}
     */
    async asistenciaPorGrupoYMes(filtro) {
        throw new Error('Sin implementar');
    }
}
