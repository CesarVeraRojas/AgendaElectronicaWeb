/**
 * eventos.page.js — El calendario de eventos del jardín (BL-76).
 * Espejo de: EventosScreen.kt
 *
 * Dos vistas: "Próximos" (la lista, agrupada por mes; es la que abre) y "Mes"
 * (la cuadrícula de lunes a domingo, con un punto de color por evento; tocar un
 * día muestra sus eventos debajo). "Nuevo evento" sólo si el servidor dice que
 * este usuario puede crear (director, o profesional con grupos).
 */
import { Casos }            from '../../core/container.js';
import { navegar }          from '../router/index.js';
import { agruparPorMes, textoFechaEvento, textoParaQuien, textoSinEventos, semanasDelMes, tituloDelMes,
         colorDeEvento } from '../../domain/entities/Evento.js';
import { html, crudo }      from '../components/html.js';
import { topBar, spinner, estadoVacio, bloqueError } from '../components/ui.js';

let calendario = null;
let vista = 'proximos';
let mesVisto = null;        // { anio, mes }
let diaElegido = null;

export function render() {
    vista = 'proximos';
    diaElegido = null;
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Eventos', volverA: 'menu' }))}
            <div class="page-content">
                <div class="vista-tabs" role="tablist">
                    <button class="vista-tab vista-tab--activa" id="tab-proximos" role="tab" aria-selected="true">Próximos</button>
                    <button class="vista-tab" id="tab-mes" role="tab" aria-selected="false">Mes</button>
                </div>
                <div id="contenido-eventos"></div>
            </div>
            <button class="fab fab--extendida" id="btn-nuevo-evento" title="Nuevo evento" aria-label="Nuevo evento" hidden>
                <span class="material-icons">add</span><span>Nuevo evento</span>
            </button>
        </div>`;
}

/** Una tarjeta de evento, con la franja del color de su tipo. */
export function tarjetaEvento(ev, hoy) {
    return html`
        <article class="evento-card" data-id="${ev.id}" style="--color-evento: ${colorDeEvento(ev.color)}" tabindex="0" role="button">
            <p class="evento-card__cuando">${textoFechaEvento(ev, hoy)}</p>
            <p class="evento-card__titulo">${ev.titulo}</p>
            <p class="evento-card__meta">
                <span class="evento-chip">${ev.tipoNombre}</span>
                ${textoParaQuien(ev)}${crudo(ev.lugar ? html` · ${ev.lugar}` : '')}
            </p>
        </article>`;
}

function pintarProximos(cont) {
    const grupos = agruparPorMes(calendario.eventos);
    cont.innerHTML = grupos.length
        ? grupos.map(g => html`
            <section class="eventos-mes">
                <h2 class="gallery-group__title">${g.mes}</h2>
                ${crudo(g.eventos.map(ev => tarjetaEvento(ev, calendario.hoy)).join(''))}
            </section>`).join('')
        : estadoVacio(textoSinEventos(calendario.puedeCrear), 'event_available');
}

function pintarMes(cont, eventosDelMes) {
    const { anio, mes } = mesVisto;
    const semanas = semanasDelMes(anio, mes, eventosDelMes, calendario.hoy);
    const celdas = semanas.flat().map(d => html`
        <button class="calendario__dia${d.delMes ? '' : ' calendario__dia--fuera'}${d.esHoy ? ' calendario__dia--hoy' : ''}${d.fecha === diaElegido ? ' calendario__dia--elegido' : ''}"
                data-fecha="${d.fecha}" aria-label="${d.fecha}${d.eventos.length ? `, ${d.eventos.length} evento(s)` : ''}">
            <span class="calendario__num">${+d.fecha.slice(8, 10)}</span>
            <span class="calendario__puntos">${crudo(d.eventos.slice(0, 3).map(ev =>
                `<i style="background:${colorDeEvento(ev.color)}"></i>`).join(''))}</span>
        </button>`).join('');
    const delDia = diaElegido ? eventosDelMes.filter(ev => ev.fechaInicio <= diaElegido && ev.fechaFin >= diaElegido) : [];
    cont.innerHTML = html`
        <div class="calendario__cabecera">
            <button class="topbar__icon calendario__flecha" id="mes-anterior" aria-label="Mes anterior"><span class="material-icons">chevron_left</span></button>
            <h2 class="calendario__titulo">${tituloDelMes(anio, mes)}</h2>
            <button class="topbar__icon calendario__flecha" id="mes-siguiente" aria-label="Mes siguiente"><span class="material-icons">chevron_right</span></button>
        </div>
        <div class="calendario" role="grid">
            ${crudo(['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span class="calendario__semana">${x}</span>`).join(''))}
            ${crudo(celdas)}
        </div>
        <div id="eventos-del-dia">
            ${crudo(diaElegido
                ? (delDia.length ? delDia.map(ev => tarjetaEvento(ev, calendario.hoy)).join('')
                                 : '<p class="evento-vacio">No hay eventos ese día.</p>')
                : '<p class="evento-vacio">Toque un día para ver sus eventos.</p>')}
        </div>`;
}

export async function init() {
    const cont = document.getElementById('contenido-eventos');
    const fab  = document.getElementById('btn-nuevo-evento');
    const tabs = { proximos: document.getElementById('tab-proximos'), mes: document.getElementById('tab-mes') };
    let eventosDelMes = [];

    const cargarMes = async () => {
        const { anio, mes } = mesVisto;
        const semanas = semanasDelMes(anio, mes, [], null);
        cont.innerHTML = spinner('Cargando el mes…');
        try {
            const c = await Casos.administrarEventos.listar({ desde: semanas[0][0].fecha, hasta: semanas.at(-1)[6].fecha });
            eventosDelMes = c.eventos;
            pintarMes(cont, eventosDelMes);
        } catch (e) {
            cont.innerHTML = bloqueError(e.message);
        }
    };

    const mostrar = (cual) => {
        vista = cual;
        for (const [k, b] of Object.entries(tabs)) {
            b.classList.toggle('vista-tab--activa', k === cual);
            b.setAttribute('aria-selected', String(k === cual));
        }
        if (cual === 'proximos') pintarProximos(cont); else cargarMes();
    };

    cont.innerHTML = spinner('Cargando eventos…');
    try {
        calendario = await Casos.administrarEventos.listar();
        mesVisto = { anio: +calendario.hoy.slice(0, 4), mes: +calendario.hoy.slice(5, 7) };
        fab.hidden = !calendario.puedeCrear;
        pintarProximos(cont);
    } catch (e) {
        cont.innerHTML = bloqueError(e.message);
        return;
    }

    tabs.proximos.addEventListener('click', () => mostrar('proximos'));
    tabs.mes.addEventListener('click', () => mostrar('mes'));
    fab.addEventListener('click', () => navegar('editar-evento', { calendario }));

    cont.addEventListener('click', (e) => {
        const tarjeta = e.target.closest('.evento-card');
        if (tarjeta) {
            const todos = [...calendario.eventos, ...eventosDelMes];
            const ev = todos.find(x => x.id === Number(tarjeta.dataset.id));
            if (ev) navegar('evento', { evento: ev, calendario });
            return;
        }
        const dia = e.target.closest('.calendario__dia');
        if (dia) { diaElegido = dia.dataset.fecha; pintarMes(cont, eventosDelMes); return; }
        if (e.target.closest('#mes-anterior') || e.target.closest('#mes-siguiente')) {
            const paso = e.target.closest('#mes-anterior') ? -1 : 1;
            const m = mesVisto.mes + paso;
            mesVisto = { anio: mesVisto.anio + (m < 1 ? -1 : m > 12 ? 1 : 0), mes: ((m + 11) % 12) + 1 };
            diaElegido = null;
            cargarMes();
        }
    });
    cont.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.closest('.evento-card')) e.target.click();
    });
}

