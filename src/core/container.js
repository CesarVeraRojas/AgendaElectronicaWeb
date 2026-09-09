/**
 * container.js — Contenedor de dependencias (composition root).
 *
 * Es el ÚNICO lugar donde las capas se conocen entre sí. Aquí se decide qué
 * implementación concreta satisface cada contrato del dominio. Las pantallas
 * piden casos de uso al contenedor y nunca instancian un repositorio ni tocan
 * HttpClient directamente.
 *
 * Cambiar el origen de datos (por ejemplo, a un backend simulado para pruebas)
 * se hace sustituyendo estas líneas, sin tocar dominio ni presentación.
 */

// Data — fuentes
import { HttpClient }             from '../data/datasources/HttpClient.js';
import { AgendaApiDataSource }    from '../data/datasources/AgendaApiDataSource.js';
import { LocalStorageDataSource } from '../data/datasources/LocalStorageDataSource.js';

// Data — implementaciones de los contratos
import { SesionRepositoryImpl }       from '../data/repositories/SesionRepositoryImpl.js';
import { AuthRepositoryImpl }         from '../data/repositories/AuthRepositoryImpl.js';
import { GrupoRepositoryImpl }        from '../data/repositories/GrupoRepositoryImpl.js';
import { EstudianteRepositoryImpl }   from '../data/repositories/EstudianteRepositoryImpl.js';
import { AsistenciaRepositoryImpl }   from '../data/repositories/AsistenciaRepositoryImpl.js';
import { ObservacionRepositoryImpl }  from '../data/repositories/ObservacionRepositoryImpl.js';
import { AgendaDiariaRepositoryImpl } from '../data/repositories/AgendaDiariaRepositoryImpl.js';
import { FotoRepositoryImpl }         from '../data/repositories/FotoRepositoryImpl.js';
import { MensajeRepositoryImpl }      from '../data/repositories/MensajeRepositoryImpl.js';
import { ProfesionalRepositoryImpl }  from '../data/repositories/ProfesionalRepositoryImpl.js';
import { ColegioRepositoryImpl }      from '../data/repositories/ColegioRepositoryImpl.js';
import { PadreRepositoryImpl }        from '../data/repositories/PadreRepositoryImpl.js';

// Domain — casos de uso
import { IniciarSesion }             from '../domain/usecases/IniciarSesion.js';
import { CerrarSesion }              from '../domain/usecases/CerrarSesion.js';
import { ObtenerSesion }             from '../domain/usecases/ObtenerSesion.js';
import { ObtenerMenuPorRol }         from '../domain/usecases/ObtenerMenuPorRol.js';
import { ObtenerColegio }            from '../domain/usecases/ObtenerColegio.js';
import { ObtenerGruposDelUsuario }   from '../domain/usecases/ObtenerGruposDelUsuario.js';
import { ObtenerEstudiantesPorGrupo }from '../domain/usecases/ObtenerEstudiantesPorGrupo.js';
import { RegistrarAsistencia }       from '../domain/usecases/RegistrarAsistencia.js';
import { GuardarObservacion }        from '../domain/usecases/GuardarObservacion.js';
import { GuardarAgendaDiaria }       from '../domain/usecases/GuardarAgendaDiaria.js';
import { SubirFoto }                 from '../domain/usecases/SubirFoto.js';
import { ObtenerMensajes }           from '../domain/usecases/ObtenerMensajes.js';
import { ObtenerDestinatarios }      from '../domain/usecases/ObtenerDestinatarios.js';
import { EnviarMensaje }             from '../domain/usecases/EnviarMensaje.js';
import { MarcarMensajeLeido }        from '../domain/usecases/MarcarMensajeLeido.js';
import { PrepararRespuesta }         from '../domain/usecases/PrepararRespuesta.js';
import { ObtenerHijos }              from '../domain/usecases/ObtenerHijos.js';
import { ObtenerAgendaDeHijo }       from '../domain/usecases/ObtenerAgendaDeHijo.js';
import { ObtenerObservacionesDeHijo }from '../domain/usecases/ObtenerObservacionesDeHijo.js';
import { ObtenerAsistenciaDeHijo }   from '../domain/usecases/ObtenerAsistenciaDeHijo.js';
import { ObtenerFotosDeHijos }       from '../domain/usecases/ObtenerFotosDeHijos.js';
import { CrearEstudianteCompleto }   from '../domain/usecases/CrearEstudianteCompleto.js';
import { CrearGrupo }                from '../domain/usecases/CrearGrupo.js';
import { CrearProfesional }          from '../domain/usecases/CrearProfesional.js';
import { ObtenerProfesionales }      from '../domain/usecases/ObtenerProfesionales.js';
import { AsignarProfesionalAGrupo }  from '../domain/usecases/AsignarProfesionalAGrupo.js';
import { ListarPadres }               from '../domain/usecases/ListarPadres.js';
import { ListarEstudiantes }          from '../domain/usecases/ListarEstudiantes.js';
import { ActualizarPadre }            from '../domain/usecases/ActualizarPadre.js';
import { ActualizarProfesional }      from '../domain/usecases/ActualizarProfesional.js';
import { ActualizarEstudiante }       from '../domain/usecases/ActualizarEstudiante.js';
import { ActualizarGrupo }            from '../domain/usecases/ActualizarGrupo.js';
import { ObtenerPadre }               from '../domain/usecases/ObtenerPadre.js';
import { ObtenerProfesional }         from '../domain/usecases/ObtenerProfesional.js';

function construir() {
    // ── Fuentes de datos ────────────────────────────────────────
    const localStorageDataSource = new LocalStorageDataSource();
    const sesionRepository       = new SesionRepositoryImpl({ localStorageDataSource });

    // HttpClient recibe un proveedor de sesión, no el repositorio entero:
    // así la capa de red no depende de dónde se guarda la sesión.
    const httpClient    = new HttpClient({ proveedorDeSesion: () => sesionRepository.obtener() });
    const apiDataSource = new AgendaApiDataSource({ httpClient });

    // ── Repositorios ────────────────────────────────────────────
    const repos = {
        sesionRepository,
        authRepository:         new AuthRepositoryImpl({ apiDataSource }),
        grupoRepository:        new GrupoRepositoryImpl({ apiDataSource }),
        estudianteRepository:   new EstudianteRepositoryImpl({ apiDataSource }),
        asistenciaRepository:   new AsistenciaRepositoryImpl({ apiDataSource }),
        observacionRepository:  new ObservacionRepositoryImpl({ apiDataSource }),
        agendaDiariaRepository: new AgendaDiariaRepositoryImpl({ apiDataSource }),
        fotoRepository:         new FotoRepositoryImpl({ apiDataSource }),
        mensajeRepository:      new MensajeRepositoryImpl({ apiDataSource }),
        profesionalRepository:  new ProfesionalRepositoryImpl({ apiDataSource }),
        colegioRepository:      new ColegioRepositoryImpl({ apiDataSource }),
        padreRepository:        new PadreRepositoryImpl({ apiDataSource }),
    };

    // ── Casos de uso ────────────────────────────────────────────
    return {
        repos,
        casos: {
            iniciarSesion:              new IniciarSesion(repos),
            cerrarSesion:               new CerrarSesion(repos),
            obtenerSesion:              new ObtenerSesion(repos),
            obtenerMenuPorRol:          new ObtenerMenuPorRol(),
            obtenerColegio:             new ObtenerColegio(repos),
            obtenerGruposDelUsuario:    new ObtenerGruposDelUsuario(repos),
            obtenerEstudiantesPorGrupo: new ObtenerEstudiantesPorGrupo(repos),
            registrarAsistencia:        new RegistrarAsistencia(repos),
            guardarObservacion:         new GuardarObservacion(repos),
            guardarAgendaDiaria:        new GuardarAgendaDiaria(repos),
            subirFoto:                  new SubirFoto(repos),
            obtenerMensajes:            new ObtenerMensajes(repos),
            obtenerDestinatarios:       new ObtenerDestinatarios(repos),
            enviarMensaje:              new EnviarMensaje(repos),
            marcarMensajeLeido:         new MarcarMensajeLeido(repos),
            prepararRespuesta:          new PrepararRespuesta(),
            obtenerHijos:               new ObtenerHijos(repos),
            obtenerAgendaDeHijo:        new ObtenerAgendaDeHijo(repos),
            obtenerObservacionesDeHijo: new ObtenerObservacionesDeHijo(repos),
            obtenerAsistenciaDeHijo:    new ObtenerAsistenciaDeHijo(repos),
            obtenerFotosDeHijos:        new ObtenerFotosDeHijos(repos),
            crearEstudianteCompleto:    new CrearEstudianteCompleto(repos),
            crearGrupo:                 new CrearGrupo(repos),
            crearProfesional:           new CrearProfesional(repos),
            obtenerProfesionales:       new ObtenerProfesionales(repos),
            asignarProfesionalAGrupo:   new AsignarProfesionalAGrupo(repos),
            listarPadres:               new ListarPadres(repos),
            listarEstudiantes:          new ListarEstudiantes(repos),
            actualizarPadre:            new ActualizarPadre(repos),
            actualizarProfesional:      new ActualizarProfesional(repos),
            actualizarEstudiante:       new ActualizarEstudiante(repos),
            actualizarGrupo:            new ActualizarGrupo(repos),
            obtenerPadre:               new ObtenerPadre(repos),
            obtenerProfesional:         new ObtenerProfesional(repos),
        },
    };
}

const contenedor = construir();

/** Casos de uso disponibles para la capa de presentación. */
export const Casos = contenedor.casos;

/** Acceso directo a la sesión, para el router y el guard de rutas. */
export const SesionActual = {
    obtener()  { return contenedor.repos.sesionRepository.obtener(); },
    existe()   { return Boolean(contenedor.repos.sesionRepository.obtener()); },
};
