/**
 * _contract.js — Utilidad para declarar contratos.
 *
 * JavaScript no tiene interfaces. Un método sin implementar lanza en vez de
 * devolver `undefined` en silencio, así un repositorio incompleto falla rápido
 * y de forma evidente durante el desarrollo.
 */
export function noImplementado(clase, metodo) {
    throw new Error(`${clase} debe implementar ${metodo}()`);
}
