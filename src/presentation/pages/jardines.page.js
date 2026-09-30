/**
 * jardines.page.js — Los jardines de AgendaKids, para soporte (BL-74).
 * Sólo web: soporte trabaja desde el computador.
 *
 * Una tarjeta por jardín con su dirección, sus cifras y si ya tiene logo (y si
 * no, con qué nombre subirlo, BL-75). Ningún dato de niños ni de familias.
 */
import { Casos }        from '../../core/container.js';
import { navegar }      from '../router/index.js';
import { textoCifras, textoLogo } from '../../domain/entities/Jardin.js';
import { html, crudo }  from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError } from '../components/ui.js';
import { fechaCorta }   from '../components/formato.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Jardines', volverA: 'menu' }))}
            <div class="page-content">
                <div id="lista-jardines"></div>
            </div>
            <button class="fab fab--extendida" id="btn-alta" title="Nuevo jardín" aria-label="Nuevo jardín">
                <span class="material-icons">add</span><span>Nuevo jardín</span>
            </button>
        </div>`;
}

function tarjeta(j) {
    const directores = j.directores.length
        ? j.directores.map(d => `${d.nombre} (${d.email})`).join(', ')
        : 'Sin director';
    return html`
        <article class="card card--section jardin">
            <h2 class="card__title">${j.nombre}</h2>
            <div class="card__body">
                <p class="jardin__dato"><span class="material-icons">badge</span>${directores}</p>
                ${crudo(j.direccion ? html`<p class="jardin__dato"><span class="material-icons">place</span>${j.direccion}</p>` : '')}
                <p class="jardin__dato"><span class="material-icons">groups</span>${textoCifras(j)}</p>
                <p class="jardin__dato${j.logo ? '' : ' jardin__dato--aviso'}"><span class="material-icons">image</span>${textoLogo(j)}</p>
                <p class="jardin__pie">Número del jardín: ${j.id}${j.creado ? ` · Alta: ${fechaCorta(j.creado)}` : ''}</p>
            </div>
        </article>`;
}

export async function init() {
    document.getElementById('btn-alta').addEventListener('click', () => navegar('alta-jardin'));
    const lista = document.getElementById('lista-jardines');
    lista.innerHTML = spinner('Cargando jardines…');
    try {
        const jardines = await Casos.administrarJardines.listar();
        lista.innerHTML = jardines.length
            ? jardines.map(tarjeta).join('')
            : estadoVacio('Todavía no hay jardines. Toque "Nuevo jardín" para dar de alta el primero.', 'domain');
    } catch (e) {
        lista.innerHTML = bloqueError(e.message);
    }
}
