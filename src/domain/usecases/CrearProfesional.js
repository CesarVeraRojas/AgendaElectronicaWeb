import { AuthError, ValidationError } from '../../core/errors.js';

/** CrearProfesional — Espejo de CrearProfesionalViewModel.crearProfesional() */
export class CrearProfesional {
    constructor({ profesionalRepository }) {
        this.profesionalRepository = profesionalRepository;
    }

    async ejecutar({ sesion, datos }) {
        if (!sesion?.colegioId) {
            throw new AuthError('No se encontró el colegio del director.');
        }

        const obligatorios = ['tipoDocumento', 'documento', 'nombres', 'apellidos', 'password'];
        const faltante = obligatorios.find(c => !String(datos[c] ?? '').trim());
        if (faltante) {
            throw new ValidationError('Complete los campos obligatorios: documento, nombres, apellidos y contraseña.');
        }

        await this.profesionalRepository.crear({
            ...datos,
            colegioId: sesion.colegioId,
            telefono:  datos.telefono?.trim() || null,
            email:     datos.email?.trim()    || null,
        });

        return 'Profesional creado con éxito.';
    }
}
