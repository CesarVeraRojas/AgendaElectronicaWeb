import { resumirAsistencia } from '../entities/Asistencia.js';

/** Dos dígitos, para componer fechas "YYYY-MM-DD" sin depender de Date. */
function dos(n) {
    return String(n).padStart(2, '0');
}

/**
 * Primer y último día de un mes, en el formato que espera el backend.
 * `mes` va de 1 a 12. El día final se calcula con Date.UTC para no arrastrar
 * el desfase de zona horaria del navegador.
 */
export function rangoDelMes(anio, mes) {
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    return {
        desde: `${anio}-${dos(mes)}-01`,
        hasta: `${anio}-${dos(mes)}-${dos(ultimoDia)}`,
    };
}

/** Mes anterior al dado, cambiando de año cuando toca. */
export function mesAnterior({ anio, mes }) {
    return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

/** Mes siguiente al dado, cambiando de año cuando toca. */
export function mesSiguiente({ anio, mes }) {
    return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

/**
 * ObtenerAsistenciaDeHijo — Asistencia de un hijo en un mes concreto (rol padre).
 *
 * El backend valida en get_asistencias_por_hijo.php que el estudiante sea hijo
 * del padre autenticado, igual que hace con las observaciones.
 */
export class ObtenerAsistenciaDeHijo {
    constructor({ asistenciaRepository }) {
        this.asistenciaRepository = asistenciaRepository;
    }

    /** @returns {Promise<{registros: Array, resumen: object}>} */
    async ejecutar(estudianteId, { anio, mes }) {
        const { desde, hasta } = rangoDelMes(anio, mes);
        const registros = await this.asistenciaRepository.listarPorHijo(estudianteId, desde, hasta);
        return { registros, resumen: resumirAsistencia(registros) };
    }
}
