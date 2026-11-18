# Sistema de diseño del museo

`src/styles.scss` es la única entrada global: conserva la interfaz existente, sin rediseñar flujos ni cambiar clases. Las hojas por funcionalidad siguen siendo globales; no deben añadirse al `styleUrl` encapsulado de un componente.

## Orden y propiedad

| Orden | Archivo bajo `src/app/` | Responsabilidad y consumidores |
|---|---|---|
| 1 | `shared/design-system/_tokens.scss` | Paleta primaria, colores semánticos, escala de espacios/radios, navegación, altura de controles y alias públicos. |
| 2 | `shared/design-system/_base.scss` | Tipografía, foco, `.literal`, `.skip-link` y movimiento reducido. |
| 3 | `shared/design-system/_forms.scss` | Botones, inputs, checkbox, textarea, labels, `.field-label` y contrato común de select nativo/PrimeNG. |
| 4 | `shared/design-system/_layout.scss` | `.section-heading`, `.toolbar`, `.actions`, `.search`, `.form-grid` y variantes móviles. |
| 5 | `shared/design-system/_feedback.scss` | `.count`, `.badge`, `.published`, `.danger`, `.error`, `.notice`. |
| 6 | `shared/design-system/_tables.scss` | Base PrimeNG y `.museum-data-table`, cabeceras reutilizables, celdas, enlaces y `.museum-table-actions`. |
| 7 | `shared/design-system/_primeng.scss` | Tokens de select, overlays, paginadores y selector compartido `.dwc-picker`. |
| 8–10 | `features/catalog/pages/catalog/catalog.scss`, `features/record-sources/pages/validation-configuration/validation-configuration.scss`, `features/importer/importer.scss` | Sincronización/definiciones; campos obligatorios y opcionales por contexto; pasos/carga/contexto/mapeo/validación/confirmación, respectivamente. |
| 11 | `features/collections/pages/collections-page/collections-page.scss` | Listado, hoja, editor y diálogos, bajo `.collections-workspace`. |

Las excepciones compactas de mapeo se aplican después de las primitivas. Todos los paginadores, incluido el resumen de campos obligatorios sin datos, comparten `.p-paginator .p-select`; no hay estilos por instancia. El corte móvil continúa en 800px y los overlays mantienen el límite del viewport.

## Tokens y uso

- `--museum-primary-50` a `--museum-primary-950`: única escala primaria, con los valores del preset original.
- `--museum-text`, `--museum-text-muted`, `--museum-heading`, `--museum-link`: texto y jerarquía.
- `--museum-page`, `--museum-surface`, `--museum-line`, `--museum-table-heading`: superficies y separación.
- `--museum-error-{surface,border,text,line}`: errores de formulario, tabla y sincronización.
- `--museum-control-{height,border,radius}` y `--museum-button-border`: geometría y bordes compartidos.
- `--museum-space-{1,2,3,4,5,6,8,10}`: escala utilizada en primitivas y shell, conservando sus medidas anteriores.
- `--museum-radius-{sm,md,lg,panel}`: radios compartidos; el control consume `md`.
- `--museum-nav-*`, `--museum-workspace-border`, `--museum-footer-text`: superficies y estados semánticos del shell, sin colores duplicados en `layouts/museum-layout/museum-layout.scss`.
  Esa hoja encapsula solo el shell persistente; sus enlaces de navegación conservan
  tokens, geometría y foco visible, con RouterLinkActive y `aria-current="page"`.
- Se conservan `--pine`, `--ink`, `--muted`, `--line`, `--select-control-{height,border,radius}`, `--mapping-control-height` y `--p-primary-color` como alias. Las medidas particulares de cada funcionalidad permanecen junto a sus reglas; no se crea una escala sin consumidores.

El mapeo conserva una única tabla: por defecto, columnas con datos primero y un separador «Campos sin datos» de 1 px antes de las vacías, repetido al inicio de las páginas interiores de ese grupo. Su texto, superficie, borde y espacios consumen tokens existentes desde `importer.scss`; los recuentos y el rótulo evitan depender solo del color. Al elegir una cabecera se ordena todo el conjunto antes de paginar y se oculta ese separador, sin cambiar índices fuente ni destinos. El diagnóstico usa la misma primitiva de tabla para resumir faltantes sin reemplazar el detalle por fila. Sus conteos de valores vacíos son botones con estado expandido; abren una única región etiquetada con ubicaciones de las celdas originales. Campo y columna se presentan una vez, sobre las filas y valores; los valores de trabajo aparecen solo si hay cambios. «Ver todas las incidencias» reemplaza esa región por el detalle completo con filtros. El cierre devuelve el foco al disparador exacto; abrir o cambiar el modo enfoca su encabezado sin desplazamiento vertical. Las tablas de diagnóstico ocultan el paginador si todo cabe en una página. La hoja de normalización conserva navegación nativa de páginas con límites deshabilitados, tamaños 10/25/50/100 y navegación adicional cuando hay más de 50 columnas visibles. El detalle reutiliza tablas, acciones y controles existentes, sin otra paleta. Las ayudas extensas usan `details`/`summary` nativos con foco visible y tokens existentes. La navegación desplaza solo su franja horizontal tras cambiar el paso activo o redimensionar la ventana, no en cada comprobación; el listener de ventana pertenece al componente y se retira al destruirlo; «Finalizar» presenta resumen, consentimientos, destino y recibo con las primitivas existentes.

La hoja de normalización tiene fila física y encabezados anclados dentro de un scroll contenido, sin desplazar horizontalmente el documento. La barra compacta ofrece botones nativos **Con cambios / Todos**, `aria-pressed` dentro de un grupo etiquetado, y un único interruptor `role=switch` para ocultar columnas; conserva etiqueta44px, control44×24, pulgar16px/translate20px, foco y reduced-motion scoped. No hay interruptores de reglas. Botones de hoja/footer y summaries tienen objetivo44px. **Formatos y reglas** y **Duplicados** comienzan cerrados; selects y ayudas de ambigüedad siguen nativos. Los controles envuelven con tokens existentes, sin otro shell ni escala tipográfica. Cambios combinan borde/superficie, nombre de regla y conteos. La tabla muestra valores literales planos (∅ para vacío); ␠/⇥/↵ se reservan al visualizador del detalle y nunca mutan datos. Rango y etiqueta pertenecen a la ventana confirmada durante carga; selección solicitada no renombra filas viejas. **Sin cambios** solo describe una vista vigente; su CTA **Mostrar todos** mueve foco al botón Todos persistente. El detalle único es una región no modal dentro del subárbol del workbench (nunca un overlay global), con texto exacto interpolado y cierre explícito/Escape que devuelve foco sin reapertura. Las celdas usan un único punto de Tab y navegación por flechas. Los formatos usan selects nativos, sin alterar su comportamiento. El main de todas las vistas usa el ancho disponible, sin límite de 1500px; reduce márgenes y conserva scroll horizontal dentro de cada tabla. El shell permite ocultar/mostrar navegación con un icono de panel, botón nativo44px, nombre accesible, aria-expanded/controls y foco persistente. Ocultarla no desmonta el análisis ni reinicia sus consultas/worker; la preferencia dura la sesión del shell. En móvil se pliega la misma franja, sin otro drawer ni trampa de foco. Estos contratos CSS y pruebas DOM no certifican aún geometría/contraste en navegador.

## Tablas: presentación compartida, datos con su propietario

`shared/ui/table-header` ofrece `th[museumSortHeader]`: botón nativo, etiqueta, dirección controlada, deshabilitación y evento `sortRequested`; `aria-sort` pertenece a la cabecera. Puede proyectar contenido semántico (campo DwC y origen secundario); sin contenido usa la etiqueta como fallback. HTML externo co-localizado; no pagina, obtiene ni conserva filas. `_tables.scss` comparte superficie, tipografía y controles con PrimeNG; `.museum-table-actions` distingue acciones con superficie y borde de la paleta vigente. Los consumidores conservan sus celdas y operaciones.

`shared/lib/table-sort.ts` es cálculo puro sin Angular, transporte ni modelos biológicos: números reales en orden numérico; strings por puntos Unicode sin trim, casefold ni coerción numérica; ausentes y texto vacío al final en ambos sentidos. Es compatible con PostgreSQL `COLLATE C`. `nextTableOrder` alterna el estado controlado y `sortTableRows` decora/copía filas con claves calculadas una vez y desempate estable, sin modificar la colección del dueño. Catálogo, mapeo y tres tablas de diagnóstico comparten las cabeceras; Fila comienza ascendente en detalles e incidencias. Los consumidores ordenan antes de paginar. Los datos no se mutan por ordenar. Esta utilidad puede importarse desde workers porque no depende de vistas.

### Anchos de columna locales

`shared/ui/table-resize/table-resize.ts` exporta `ResizableTable` y `ResizableColumn`. Es un único mecanismo para tablas nativas y plantillas proyectadas de PrimeNG: `museumResizableTable` en la tabla/contenedor PrimeNG y `museumResizableColumn` en **cada cabecera hoja**, también fila física y acciones sin ordenamiento. No se aplica al separador de mapeo con `colspan`. `resizeLabel` es obligatorio; `initialColumnWidth` opcional expresa píxeles (240 por defecto). El controlador mantiene un `colgroup`, ancho total explícito y layout fijo; el scroll queda en el contenedor existente. Las reglas específicas de estado sustituyen mínimos/porcentajes legados sin quitar posiciones sticky. Mapeo comienza con 166/300/366 px, equivalentes a sus proporciones 20/36/44 sobre 52rem a 16px.

El botón ↔ está siempre visible: arrastre con ratón/toque, flechas izquierda/derecha (16px), Inicio/Fin (96/960px), o clic para introducir un ancho numérico y pulsar **Aplicar ancho**, sin arrastrar. El control anuncia etiqueta, valor, unidades y límites. **Restablecer ancho** o doble clic devuelve el ancho inicial; Escape/Cerrar devuelve foco al control. El popover nativo usa la capa superior, sin recortarse dentro del scroll; existe cierre explícito también sin esa API. Cancelar un puntero revierte el gesto; desmontar la cabecera o cambiar el contexto cancela sus listeners. Ningún gesto ordena la tabla ni abre el editor de celdas. El observador solo mira miembros/orden de la fila de cabeceras, nunca valores del cuerpo, atributos o estilos; no hay bucle RAF.

Contrato de integración (importar ambas directivas en el consumidor):

```html
<div class="normalization-scroll">
  <table museumResizableTable [resizeContext]="datasetSession()">
    <thead><tr>
      <th museumResizableColumn="physical-row" resizeLabel="Fila de origen" [initialColumnWidth]="128">Fila</th>
      @for (column of visibleColumns(); track column.index) {
        <th [museumResizableColumn]="'' + column.index" [resizeLabel]="column.header"
          museumSortHeader [label]="column.header"> </th>
      }
    </tr></thead>
    <!-- El consumidor conserva cuerpo, ordenamiento y paginación. -->
  </table>
</div>
```

Las claves son únicas y estables por tabla: en Normalizar, índice **fuente**, no posición de ventana ni destino DwC; en Colecciones, clave del esquema. Mantener ventanas de 25/50 y wrappers de scroll. `[resizeContext]` acepta identidad opaca de vista y solo cambia con un dataset/colección nueva, nunca al paginar, filtrar, ordenar o cambiar ventana. Omitido, los anchos duran lo que dure esa instancia. Una cabecera oculta puede desmontarse y recuperar su ancho al volver; varias tablas montadas son independientes. La memoria es exclusivamente local del controlador: nada de localStorage, API, Query, worker, filas, nombres de archivo ni preview; ajustar disposición no valida ni aplica normalización. No se crea mecanismo de guardado ni se cambia `compareTableValues`.

## Colecciones: especialización acotada

`collections-page.scss`, importado globalmente después de `importer.scss`, limita sus reglas a `.collections-workspace`. Reutiliza paleta, espacios, radios, formularios y selector DwC existentes, sin tokens ni colores nuevos. La hoja contiene el scroll horizontal/vertical, cabeceras y primera columna sticky (también su esquina); las ventanas de 25 columnas son presentación, no un recorte de datos. La fila de origen identifica cada registro sin exponer identificadores técnicos en las ayudas. Celdas acotadas con elipsis, relleno reducido y acciones agrupadas aprovechan el ancho; cabeceras, fila y acciones quedan ancladas al desplazar. El texto completo se conserva y está disponible en edición/formulario. Valores literales no ejecutan fórmulas. Ocultar columnas sin datos comienza activo, evalúa toda la página antes de las ventanas y no altera los valores; los espacios y `0` cuentan como datos.

Listado y campos del formulario pasan de dos columnas a una en 800px. Controles compactos en escritorio; botones, selects, summaries y celdas tienen altura mínima de 44px en móvil o puntero grueso solo en este ámbito, sin alterar Normalizar. Doble clic, Enter/Espacio o toque abren la misma edición de celda; guardar es explícito y blur no envía. Escape cancela la celda. El borrador puede recuperarse fuera de su ventana con Volver a la celda. El formulario completo/alta usa un diálogo nativo separado de papelera/restauración, con selectores propios, foco de entrada y retorno, Escape protegido y cierre bloqueado mientras guarda. Ante resultado desconocido deja de ser modal para poder revisar todas las páginas conservando el borrador. Los diálogos contienen su desplazamiento. Buscar campos oculta controles, no sus valores. No se cambia el comportamiento nativo de selects ni se amplían reglas a otras funcionalidades. [Flujo de gestión](README.md#colecciones-persistidas).

Para añadir una acción, reutilizar `button` y `.actions`; para un formulario, `label` y `.form-grid`; para un selector DwC, el componente compartido existente y su clase `.dwc-picker`. No sustituir selects nativos ni duplicar su comportamiento. El estado de sincronización conserva su nodo/aria-live, oculto en reposo para evitar prosa y espacio repetidos; el contexto del catálogo sigue como descripción accesible. Consentimientos, datos originales y errores no se retiran.

## PrimeNG: misma paleta, no otra copia

`shared/design-system/museum.preset.ts` exporta `MuseumPreset`, construido con `definePreset(Aura, …)`. Cada tono primario referencia `var(--museum-primary-N)`; los hexadecimales solo viven en `_tokens.scss`. Los alias CSS también referencian esa escala. La flecha SVG del select conserva el color de texto secundario codificado en su URI, no otra escala primaria.

`app.config.ts` importa `MuseumPreset` y lo utiliza como `theme.preset`, sin otra paleta inline y manteniendo `darkModeSelector: false`. El shell consume los mismos tokens semánticos; un cambio de color compartido se realiza en `_tokens.scss`, no en cada componente.

## Limpieza y comprobación

El administrador de Fuentes de registros biológicos usa selección lateral con botones nativos y `aria-pressed`, recuentos reales, un espacio dedicado con selector compartido DwC y búsqueda sobre ambos estados de la lista. Cada fila conserva su posición y foco al alternar con un botón nativo **Obligatorio / Opcional** junto a **Quitar**; texto visible, nombre de acción accesible y `aria-pressed` indican la obligatoriedad sin depender del color. Los recuentos distinguen total, obligatorios y opcionales. Quitar retira el campo de la configuración, no equivale a hacerlo opcional. Las acciones envuelven con espacios existentes en pantallas estrechas. La búsqueda no modifica el borrador. A 800px las fuentes se apilan antes del editor, en dos columnas; los campos largos envuelven texto y la lista limita su altura solo en escritorio. Controles de al menos 44px, foco visible y borde primary-700 conservan la dirección del artboard maestro-detalle; superficies, estados, espacios y radios proceden de tokens. Sin nuevas fuentes, colores ni sombras. Sus espacios, bordes y variante móvil consumen tokens existentes; no incorpora una segunda paleta ni estilos encapsulados que rompan overlays. Los controles indican pendiente/error y las entradas sobreviven a fallos. El guard de Fuentes confirma la salida tanto con cambios sin guardar como con
texto aún no agregado; el editor conserva la protección beforeunload.

`shared/design-system/design-system.spec.ts` compila la entrada global y comprueba paleta/preset, controles y overlays, selección/foco/filas, sincronización/movimiento y variantes móviles. Son comprobaciones de contrato CSS, no sustituyen mediciones de navegador. Consultar [VERIFICATION.md](../VERIFICATION.md) para resultados, incidentes y límites, distinguiendo evidencia histórica de las comprobaciones del cambio global actual; no es una auditoría exhaustiva de accesibilidad.
