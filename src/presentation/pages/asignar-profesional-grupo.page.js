/**
 * asignar-profesional-grupo.page.js — Asignar grupos a un profesional.
 * Espejo de: ui/screens/AsignarProfesionalGrupoScreen.kt + su ViewModel
 *
 * El endpoint acepta varios grupos a la vez (grupo_ids), así que aquí se usa
 * selección múltiple, como el GroupSelectionDialog de SharedComposables.kt.
 */
import { Casos }            from '../../core/container.js';
import { html, esc, crudo } from '../components/html.js';
import { topBar, seccion, campoSelect, botonPrimario, spinner, bloqueError } from '../components/ui.js';
import { avisoError, avisoExito } from '../components/avisos.js';

export function render() {
    return html`
        <div class="page">
            ${crudo(topBar({ titulo: 'Asignar Profesional a Grupo', volverA: 'menu' }))}
            <div class="page-content">
                ${crudo(seccion('Asignación',
                    campoSelect({ id: 'profesional', etiqueta: 'Profesional', opciones: [], placeholder: 'Cargando…', deshabilitado: true })))}

                <section class="card card--section">
                    <h2 class="card__title">Grupos a Asignar</h2>
                    <p class="pick-groups__status" id="aviso-asignacion" hidden></p>
                    <div class="card__body" id="lista-grupos"></div>
                </section>

                ${crudo(botonPrimario({ id: 'btn-guardar', texto: 'Guardar Asignación', deshabilitado: true }))}
            </div>
        </div>`;
}

export async function init() {
    const sesion  = Casos.obtenerSesion.ejecutar();
    const selProf = document.getElementById('profesional');
    const contGrupos = document.getElementById('lista-grupos');
    const btn     = document.getElementById('btn-guardar');

    const gruposMarcados = () =>
        [...contGrupos.querySelectorAll('input[type=checkbox]:checked')].map(c => c.value);

    const refrescarBoton = () => {
        btn.disabled = !(selProf.value && gruposMarcados().length);
    };

    contGrupos.innerHTML = spinner('Cargando grupos…');

    // Profesionales y grupos del colegio del director
    try {
        const [profesionales, grupos] = await Promise.all([
            Casos.obtenerProfesionales.ejecutar(sesion),
            Casos.obtenerGruposDelUsuario.ejecutar(sesion),
        ]);

        selProf.innerHTML = `<option value="">Seleccione un profesional…</option>` +
            profesionales.map(p => `<option value="${esc(p.id)}">${esc(p.nombreCompleto)}</option>`).join('');
        selProf.disabled = false;

        contGrupos.innerHTML = grupos.length
            ? grupos.map(g => html`
                <label class="pick-row" for="grp-${g.id}">
                    <input type="checkbox" id="grp-${g.id}" value="${g.id}" />
                    <span class="pick-row__name">${g.nombreGrupo}</span>
                </label>`).join('')
            : '<p>No hay grupos en este colegio.</p>';

        contGrupos.querySelectorAll('input[type=checkbox]')
            .forEach(c => c.addEventListener('change', refrescarBoton));
    } catch (e) {
        contGrupos.innerHTML = bloqueError(e.message);
        return;
    }

    // Al elegir profesional se marcan los grupos que YA tiene. Es imprescindible,
    // no un adorno: el endpoint SUSTITUYE las asignaciones (borra las suyas e
    // inserta las recibidas), así que con la lista en blanco el director que
    // añadía un grupo dejaba al profesional sin los que tenía, y sin aviso.
    // Lo que se ve marcado es exactamente lo que se va a guardar.
    const aviso = document.getElementById('aviso-asignacion');
    selProf.addEventListener('change', async () => {
        contGrupos.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
        refrescarBoton();

        if (!selProf.value) { aviso.hidden = true; return; }

        aviso.hidden = false;
        aviso.textContent = 'Consultando sus grupos actuales…';
        try {
            const suyos = await Casos.obtenerGruposDeProfesional.ejecutar(sesion, selProf.value);
            suyos.forEach(g => {
                const c = document.getElementById(`grp-${g.id}`);
                if (c) c.checked = true;
            });
            aviso.textContent = suyos.length
                ? `Ya tiene ${suyos.length === 1 ? 'este grupo' : 'estos grupos'}: ${suyos.map(g => g.nombreGrupo).join(', ')}. ` +
                  'Se guardará exactamente lo que quede marcado; si desmarca uno, se le quita.'
                : 'Ahora mismo no tiene ningún grupo asignado.';
        } catch (e) {
            // Que no se pueda consultar no debe impedir asignar, pero el director
            // tiene que saber que lo marcado puede no ser todo lo que hay.
            aviso.textContent = 'No se pudieron consultar sus grupos actuales. ' +
                'Cuidado: al guardar se sustituyen TODAS sus asignaciones por las que marque.';
        } finally {
            refrescarBoton();
        }
    });

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const msg = await Casos.asignarProfesionalAGrupo.ejecutar({
                profesionalId: selProf.value,
                grupoIds:      gruposMarcados(),
            });
            avisoExito(msg);
            contGrupos.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
            selProf.value = '';
            document.getElementById('aviso-asignacion').hidden = true;
        } catch (e) {
            avisoError(e.message);
        } finally {
            refrescarBoton();
        }
    });
}
