# Frontend organizado por funcionalidad

El árbol de `src/app` expresa los tres dominios visibles: catálogo Darwin Core,
fuentes de registros biológicos y análisis local de colecciones. El contexto es
único por archivo; las revisiones son control de concurrencia, no un ciclo de publicación.

## Propietarios y límites

| Ubicación | Responsabilidad |
| --- | --- |
| `features/catalog` | `Catalog`, su HTML y el contrato `Term` en `models/catalog-term.ts`. |
| `features/record-sources` | Administrador de fuentes, HTML/SCSS/pruebas y contratos `ValidationConfiguration`, `ContextRequirements`, `Context` en `models/validation-configuration.ts`. |
| `features/importer/workbench` | Orquestación del análisis y HTML; conserva `map`, invalidación, cancelación y guardas de generación/navegación. |
| `features/importer/components` | `column-mapping`, `record-context` y `normalization-preview`: presentación de reglas, ventanas, grupos y detalle original accesible. |
| `features/importer/engine` | Parser CSV/XLSX, normalizador, validador, exportación y `analysis.worker`; pruebas del motor colocadas aquí. |
| `features/importer/models` | `dataset` y límites, `context`, `analysis-result`, `normalization`, `normalization-preview` y `worker-protocol`. |
| `core/api` | `Api`: fachada de metadatos con HttpClient y puente Promise/AbortSignal para Query; conserva revisiones y POST sin cuerpo. La base viene de `environment.baseUrl`; token `BASE_URL` reemplazable en pruebas. No recibe archivos ni registros biológicos. |
| `core/i18n` | Etiquetas y presentación localizada; conserva citas oficiales y texto arbitrario del usuario. |
| `shared/ui/dwc-picker` | Selector reutilizable de una entrada; conserva valor libre, limpieza y deshabilitación con Signal Forms. |
| `shared/design-system` | Tokens semánticos, primitivas globales, adaptación de PrimeNG y preset desde la misma paleta CSS. |
| `testing` | Pruebas de composición, estilos y cruces entre funcionalidades; las pruebas propias permanecen junto al propietario. |

`App` sigue siendo la composición raíz: navegación, vistas diferidas, workbench
montado y coordinación de consultas/caché. No es un repositorio ni un motor de análisis.
`app.config.ts` compone explícitamente HttpClient y un solo cliente Query.
No hay proxy Angular/Nginx ni caché de `httpResource`: el navegador contacta la
URL absoluta del backend, que debe permitir su origen por CORS.
`src/environments/environment.ts` configura `baseUrl` para el build normal;
`environment.development.ts` lo reemplaza mediante `fileReplacements` para
serve/watch/build development. Ambos contienen solo configuración pública local;
cambiarla requiere recompilar, no pasar variables al contenedor ya construido.
No hay inicializador, JSON ni generador runtime. Nginx usa su configuración
estática predeterminada: las rutas Angular están vacías y la navegación entre
secciones es estado local del shell en `/`, sin enlaces profundos.

Las dependencias entre funcionalidades apuntan a contratos con `import type`, no a
sus vistas. `core` y `shared` pueden consumir esos modelos, nunca importar componentes
de funcionalidad. No hay `shared/models`, contratos duplicados ni barrels de compatibilidad.
El motor no importa transporte ni vistas: el archivo y sus celdas permanecen en el navegador.

## Costuras que deben conservarse

- `workbench/import-workbench.ts` crea el worker mediante
  `new URL('../engine/analysis.worker', import.meta.url)`; Angular debe empaquetarlo
  como módulo independiente. El worker conserva sus imports locales del motor.
- El controlador local `workbench/normalization-preview-state.ts` conserva solo metadata y ventana actual, original de sesión y referencias al worker persistente. El workbench crea `new URL('../engine/normalization-preview.worker', import.meta.url)`, independiente del worker efímero de análisis. Init envía original/mapping una vez; update solo opciones; page solo ventana con índices físicos explícitos. Ambos comparten contador de mensajes, pero no guardas de generación: paginar/ocultar no invalida validación. Session/generation/id y la identidad del worker descartan respuestas antiguas; error/cancelación requieren reintento manual. No hay dataset en Query, almacenamiento ni API.
- `normalizationVisible` comunica el paso derivado al shell; la clase ancha requiere además sección activa workbench. El input `active` cierra detalles al ocultarlo, sin desmontar ni reinicializar su worker. No hay mutaciones imperativas de clases ni selectores `:has`.
- Los HTML grandes están junto a `catalog.ts`, `validation-configuration.ts` y al workbench;
  las plantillas pequeñas de los auxiliares siguen inline.
- El administrador maestro-detalle deriva recuentos y búsqueda del borrador completo;
  filtrar la lista no modifica datos guardados. El nombre Contexto del análisis permanece intacto.
  El editor guarda cinco contextos con revisión, sin enviar datos del archivo. Query actualiza
  el snapshot global y el importador invalida su generación cuando cambia. Los errores
  conservan las entradas locales; el shell protege la salida con cambios sin guardar.
- Cada funcionalidad posee su hoja SCSS. `src/styles.scss` las carga después de
  las primitivas compartidas, de forma global para conservar overlays y encapsulación.
  `app.config.ts` consume `MuseumPreset`; la paleta solo se define en los tokens CSS.
  El contrato visual y su escala están documentados en [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Las pruebas de estilos trasladadas a `testing` apuntan a `../../styles.scss`.
  La suite y el build deben ejecutarse sobre el árbol integrado con sus estilos definitivos.
