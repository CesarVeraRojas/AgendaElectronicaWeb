/**
 * main.js — Punto de entrada de la aplicación.
 * Equivalente a MainActivity.kt: arranca la navegación y la vigilancia de novedades.
 */
import { iniciarRouter } from './presentation/router/index.js';
import { iniciarSondeo } from './presentation/novedades/sondeo.js';

iniciarRouter();

// Consulta periódica de novedades. Si no hay sesión no hace nada, así que
// puede arrancar aquí sin esperar al login.
iniciarSondeo();
