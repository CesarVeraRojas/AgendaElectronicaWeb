import { ValidationError } from '../../core/errors.js';

/**
 * SubirFoto — Espejo de FotosViewModel.uploadFoto()
 *
 * En Android hubo que corregir un bug por el que las fotos se guardaban con
 * extensión .tmp; la web no tiene ese problema porque el objeto File del
 * navegador ya trae nombre y tipo MIME reales. Sí se valida el tipo aquí,
 * antes de gastar la subida.
 */
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif'];

export class SubirFoto {
    constructor({ fotoRepository }) {
        this.fotoRepository = fotoRepository;
    }

    async ejecutar({ estudianteId, archivo }) {
        if (!estudianteId) throw new ValidationError('Seleccione un estudiante.');
        if (!archivo)      throw new ValidationError('Seleccione una foto.');
        if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
            throw new ValidationError('Tipo de archivo no permitido. Solo JPG, PNG o GIF.');
        }

        await this.fotoRepository.subir(estudianteId, archivo);
        return 'Foto subida con éxito.';
    }
}
