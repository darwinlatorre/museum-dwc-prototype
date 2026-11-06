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
| 6 | `shared/design-system/_tables.scss` | Base `.p-datatable`, celdas, cabeceras y enlaces. |
| 7 | `shared/design-system/_primeng.scss` | Tokens de select, overlays, paginadores y selector compartido `.dwc-picker`. |
| 8–10 | `features/catalog/catalog.scss`, `features/record-sources/validation-configuration.scss`, `features/importer/importer.scss` | Sincronización/definiciones; campos obligatorios y opcionales por contexto; pasos/carga/contexto/mapeo/validación, respectivamente. |

Las excepciones compactas de mapeo se aplican después de las primitivas. Todos los paginadores, incluido el resumen de campos obligatorios sin datos, comparten `.p-paginator .p-select`; no hay estilos por instancia. El corte móvil continúa en 800px y los overlays mantienen el límite del viewport.

## Tokens y uso

- `--museum-primary-50` a `--museum-primary-950`: única escala primaria, con los valores del preset original.
- `--museum-text`, `--museum-text-muted`, `--museum-heading`, `--museum-link`: texto y jerarquía.
- `--museum-page`, `--museum-surface`, `--museum-line`, `--museum-table-heading`: superficies y separación.
- `--museum-error-{surface,border,text,line}`: errores de formulario, tabla y sincronización.
- `--museum-control-{height,border,radius}` y `--museum-button-border`: geometría y bordes compartidos.
- `--museum-space-{1,2,3,4,5,6,8,10}`: escala utilizada en primitivas y shell, conservando sus medidas anteriores.
- `--museum-radius-{sm,md,lg,panel}`: radios compartidos; el control consume `md`.
- `--museum-nav-*`, `--museum-workspace-border`, `--museum-footer-text`: superficies y estados semánticos del shell, sin colores duplicados en `app.scss`.
- Se conservan `--pine`, `--ink`, `--muted`, `--line`, `--select-control-{height,border,radius}`, `--mapping-control-height` y `--p-primary-color` como alias. Las medidas particulares de cada funcionalidad permanecen junto a sus reglas; no se crea una escala sin consumidores.

El mapeo conserva una única tabla: columnas con datos primero y un separador «Campos sin datos» de 1 px antes de las vacías, repetido al inicio de las páginas interiores de ese grupo. Su texto, superficie, borde y espacios consumen tokens existentes desde `importer.scss`; los recuentos y el rótulo evitan depender solo del color. El diagnóstico usa la misma primitiva de tabla para resumir faltantes sin reemplazar el detalle por fila. Sus conteos de valores vacíos son botones con estado expandido; abren una única región etiquetada con ubicaciones de las celdas originales. Campo y columna se presentan una vez, sobre las filas y valores; los valores de trabajo aparecen solo si hay cambios. «Ver todas las incidencias» reemplaza esa región por el detalle completo con filtros. El cierre devuelve el foco al disparador exacto; abrir o cambiar el modo enfoca su encabezado sin desplazamiento vertical. Las tablas de diagnóstico ocultan el paginador si todo cabe en una página. La hoja de normalización conserva navegación nativa de páginas con límites deshabilitados, tamaños 10/25/50/100 y navegación adicional cuando hay más de 50 columnas visibles. El detalle reutiliza tablas, acciones y controles existentes, sin otra paleta. Las ayudas extensas usan `details`/`summary` nativos con foco visible y tokens existentes. La navegación desplaza solo su franja horizontal tras cambiar el paso activo o redimensionar la ventana, no en cada comprobación; el listener de ventana pertenece al componente y se retira al destruirlo; «Finalizar» no incorpora contenido todavía.

La hoja de normalización tiene fila física y encabezados anclados dentro de un scroll contenido, sin desplazar horizontalmente el documento. La barra compacta ofrece botones nativos **Con cambios / Todos**, `aria-pressed` dentro de un grupo etiquetado, y un único interruptor `role=switch` para ocultar columnas; conserva etiqueta44px, control44×24, pulgar16px/translate20px, foco y reduced-motion scoped. No hay interruptores de reglas. Botones de hoja/footer y summaries tienen objetivo44px. **Formatos y reglas** y **Duplicados** comienzan cerrados; selects y ayudas de ambigüedad siguen nativos. Los controles envuelven con tokens existentes, sin otro shell ni escala tipográfica. Cambios combinan borde/superficie, nombre de regla y conteos. La tabla muestra valores literales planos (∅ para vacío); ␠/⇥/↵ se reservan al visualizador del detalle y nunca mutan datos. Rango y etiqueta pertenecen a la ventana confirmada durante carga; selección solicitada no renombra filas viejas. **Sin cambios** solo describe una vista vigente; su CTA **Mostrar todos** mueve foco al botón Todos persistente. El detalle único es una región no modal dentro del subárbol del workbench (nunca un overlay global), con texto exacto interpolado y cierre explícito/Escape que devuelve foco sin reapertura. Las celdas usan un único punto de Tab y navegación por flechas. Los formatos usan selects nativos, sin alterar su comportamiento. El ensanche del main se restringe a Normalizar visible desde 1600px; no cambia sidebar ni otras vistas. Estos contratos CSS y pruebas DOM no certifican aún geometría/contraste en navegador.

Para añadir una acción, reutilizar `button` y `.actions`; para un formulario, `label` y `.form-grid`; para un selector DwC, el componente compartido existente y su clase `.dwc-picker`. No sustituir selects nativos ni duplicar su comportamiento.

## PrimeNG: misma paleta, no otra copia

`shared/design-system/museum.preset.ts` exporta `MuseumPreset`, construido con `definePreset(Aura, …)`. Cada tono primario referencia `var(--museum-primary-N)`; los hexadecimales solo viven en `_tokens.scss`. Los alias CSS también referencian esa escala. La flecha SVG del select conserva el color de texto secundario codificado en su URI, no otra escala primaria.

`app.config.ts` importa `MuseumPreset` y lo utiliza como `theme.preset`, sin otra paleta inline y manteniendo `darkModeSelector: false`. El shell consume los mismos tokens semánticos; un cambio de color compartido se realiza en `_tokens.scss`, no en cada componente.

## Limpieza y comprobación

El administrador de Fuentes de registros biológicos usa selección lateral con botones nativos y `aria-pressed`, recuentos reales, un espacio dedicado con selector compartido DwC y búsqueda sobre ambos estados de la lista. Cada fila conserva su posición y foco al alternar con un botón nativo **Obligatorio / Opcional** junto a **Quitar**; texto visible, nombre de acción accesible y `aria-pressed` indican la obligatoriedad sin depender del color. Los recuentos distinguen total, obligatorios y opcionales. Quitar retira el campo de la configuración, no equivale a hacerlo opcional. Las acciones envuelven con espacios existentes en pantallas estrechas. La búsqueda no modifica el borrador. A 800px las fuentes se apilan antes del editor, en dos columnas; los campos largos envuelven texto y la lista limita su altura solo en escritorio. Controles de al menos 44px, foco visible y borde primary-700 conservan la dirección del artboard maestro-detalle; superficies, estados, espacios y radios proceden de tokens. Sin nuevas fuentes, colores ni sombras. Sus espacios, bordes y variante móvil consumen tokens existentes; no incorpora una segunda paleta ni estilos encapsulados que rompan overlays. Los controles indican pendiente/error y las entradas sobreviven a fallos. El shell confirma la salida con cambios sin guardar.

`shared/design-system/design-system.spec.ts` compila la entrada global y comprueba paleta/preset, controles y overlays, selección/foco/filas, sincronización/movimiento y variantes móviles. Son comprobaciones de contrato CSS, no sustituyen mediciones de navegador. Consultar [VERIFICATION.md](../VERIFICATION.md) para resultados, incidentes y límites, distinguiendo evidencia histórica de las comprobaciones del cambio global actual; no es una auditoría exhaustiva de accesibilidad.
