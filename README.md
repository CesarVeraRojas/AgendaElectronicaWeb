# Frontend Web — Agenda Electrónica

SPA en HTML + CSS + JavaScript (ES Modules), sin frameworks ni herramientas de compilación.
Reutiliza el backend PHP de `archivos APP/` y la base de datos existentes, sin modificarlos.

## Cómo probarlo en local

⚠️ **No funciona haciendo doble clic en `index.html`.** El navegador bloquea los ES Modules
cuando la página se abre con `file://`, y la aplicación no llega ni a cargarse. Hay que
servirla por HTTP.

Cualquiera de estas opciones sirve — se ejecuta **dentro de esta carpeta**:

```bash
# Python (suele venir instalado)
python3 -m http.server 8000
#  o en Windows:  py -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Luego abrir <http://localhost:8000>.

En VS Code también funciona la extensión **Live Server** (clic derecho sobre `index.html` →
"Open with Live Server").

No hace falta configurar nada más: el servidor de producción ya envía las cabeceras CORS
necesarias (`Access-Control-Allow-Origin: *`, con `X-User-Id` y `X-User-Type` permitidas),
así que la web en `localhost` puede consumir la API real.

## Cómo publicarlo

Cualquier hosting estático sirve: no requiere Node ni compilación, los archivos se suben
tal cual.

### Render

Este repositorio contiene **sólo el frontend**. El backend PHP y la base de datos viven
en un repositorio privado aparte y ya están desplegados en
`https://kindergartenhappychildren.com/api/agenda/`, que es a donde apunta
`src/core/config.js`.

En Render hay que elegir **Static Site** (no Web Service: aquí no se ejecuta ningún
proceso de servidor). Configuración:

| Campo | Valor |
|---|---|
| Root Directory | *(vacío — la raíz del repo ya es esta carpeta)* |
| Build Command | *(vacío)* |
| Publish Directory | `.` |

No hace falta ninguna regla de rewrite: el router es por hash (`#/login`, `#/menu`), así
que el servidor siempre entrega `index.html` y recargar nunca da 404.

El `render.yaml` incluido define exactamente esa configuración, por si prefieres
desplegar como Blueprint en vez de rellenar el formulario.

### Si cambia la URL del backend

Editar `BASE_URL` en `src/core/config.js` y volver a desplegar. Es el único punto del
código que conoce la dirección de la API.

## Estructura

```
src/
├── core/           config, errores y contenedor de dependencias
├── domain/         entidades, contratos y casos de uso  ← lógica de negocio
├── data/           HttpClient, endpoints, mappers y repositorios
├── presentation/   router, componentes y las 17 pantallas
└── styles/         theme.css (tokens) + app.css (componentes)
```

**Regla de dependencias:** `presentation → domain ← data`. El dominio no importa `fetch`,
`document` ni `localStorage`; las capas externas se enchufan en `core/container.js`.

## Pruebas

```bash
node tests/dominio.test.mjs     # reglas de negocio
node tests/escapado.test.mjs    # defensa XSS
```

Corren sin navegador, sin red y sin base de datos: es la señal de que el dominio está aislado.
