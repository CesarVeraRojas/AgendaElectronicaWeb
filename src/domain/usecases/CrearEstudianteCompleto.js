import { AuthError, ValidationError, ServerError } from '../../core/errors.js';

/**
 * CrearEstudianteCompleto — Espejo de CrearEstudianteViewModel.crearEstudianteCompleto()
 *
 * Orquesta 5 llamadas encadenadas al backend. Igual que en Android, se detiene
 * en el primer fallo. Es la lógica de negocio más compleja de la aplicación y
 * por eso vive en el dominio, no en la pantalla.
 *
 *   1. Crear estudiante        → devuelve estudianteId
 *   2. Crear acudiente 1       → devuelve acudienteId
 *   3. Crear acudiente 2       → opcional, sólo si viene completo
 *   4. Asignar acudientes al estudiante
 *   5. Asignar estudiante al grupo
 *
 * ⚠️ Estos pasos NO son transaccionales en el backend actual: si el paso 4 falla,
 * el estudiante y los acudientes ya quedaron creados. Corregirlo requiere una
 * transacción del lado del servidor (queda anotado en BL-12 del backlog).
 */
export class CrearEstudianteCompleto {
    constructor({ estudianteRepository }) {
        this.estudianteRepository = estudianteRepository;
    }

    async ejecutar({ sesion, estudiante, acudiente1, acudiente2, grupoId }) {
        if (!sesion?.colegioId) {
            throw new AuthError('No se encontró el colegio del director. Inicie sesión de nuevo.');
        }
        if (!grupoId) {
            throw new ValidationError('Por favor, seleccione un grupo.');
        }
        if (!acudiente1?.estaCompleto()) {
            throw new ValidationError('Complete todos los datos del primer acudiente.');
        }

        // Paso 1 — Estudiante
        const estudianteId = await this.estudianteRepository.crear({
            ...estudiante,
            colegioId: sesion.colegioId,
        });
        if (!estudianteId) throw new ServerError('El API no devolvió un ID para el estudiante.');

        // Paso 2 — Acudiente 1
        const acudienteIds = [];
        const id1 = await this.estudianteRepository.crearAcudiente(acudiente1);
        if (id1) acudienteIds.push(id1);

        // Paso 3 — Acudiente 2 (sólo si todos sus campos vienen llenos)
        if (acudiente2?.estaCompleto()) {
            const id2 = await this.estudianteRepository.crearAcudiente(acudiente2);
            if (id2) acudienteIds.push(id2);
        }

        if (acudienteIds.length === 0) {
            throw new ServerError('El API no devolvió IDs para los acudientes.');
        }

        // Paso 4 — Vincular acudientes
        await this.estudianteRepository.asignarAcudientes(estudianteId, acudienteIds);

        // Paso 5 — Vincular grupo
        await this.estudianteRepository.asignarAGrupo(estudianteId, grupoId);

        return '¡Estudiante creado con éxito!';
    }
}
