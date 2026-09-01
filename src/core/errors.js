/**
 * errors.js — Errores de dominio.
 * Permiten a la capa de presentación distinguir el tipo de fallo
 * sin conocer códigos HTTP ni detalles de la capa de datos.
 */
export class AppError extends Error {
    constructor(message, cause = null) {
        super(message);
        this.name = 'AppError';
        this.cause = cause;
    }
}

/** El servidor respondió, pero con un fallo de negocio o de validación. */
export class ServerError extends AppError {
    constructor(message, status = null) {
        super(message);
        this.name = 'ServerError';
        this.status = status;
    }
}

/** No se pudo contactar al servidor. */
export class NetworkError extends AppError {
    constructor(message = 'No se pudo conectar con el servidor. Revise su conexión.') {
        super(message);
        this.name = 'NetworkError';
    }
}

/** La sesión no existe o el rol no tiene permiso. */
export class AuthError extends AppError {
    constructor(message = 'Sesión no válida. Inicie sesión de nuevo.') {
        super(message);
        this.name = 'AuthError';
    }
}

/** Datos de entrada inválidos, detectado en el dominio antes de llamar a la red. */
export class ValidationError extends AppError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
