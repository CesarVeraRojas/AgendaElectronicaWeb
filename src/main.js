/**
 * main.js — Punto de entrada de la aplicación.
 * Equivalente a MainActivity.kt: arranca la navegación y la vigilancia de novedades.
 */
import { iniciarRouter, navegar }        from './presentation/router/index.js';
import { iniciarSondeo, olvidarNovedades } from './presentation/novedades/sondeo.js';
import { alExpirarLaSesion }             from './core/sesionExpirada.js';

// Si el servidor rechaza el token —caducado, o cerrado desde otro sitio— hay que
// salir del menú (BL-59). La sesión ya la ha borrado el contenedor; aquí queda
// lo que es de la pantalla: parar los avisos de quien se acaba de ir y llevar al
// login diciendo por qué, que si no el salto parece un fallo.
alExpirarLaSesion(() => {
    olvidarNovedades();
    navegar('login', { sesionCaducada: true });
});

iniciarRouter();

// Consulta periódica de novedades. Si no hay sesión no hace nada, así que
// puede arrancar aquí sin esperar al login.
iniciarSondeo();
