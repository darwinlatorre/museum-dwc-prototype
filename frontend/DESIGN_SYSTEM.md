# Sistema de diseño del museo

`src/styles.scss` es la única entrada global: conserva la interfaz existente, sin rediseñar flujos ni cambiar clases. Las hojas por funcionalidad siguen siendo globales; no deben añadirse al `styleUrl` encapsulado de un componente.

## Orden y propiedad

| Orden | Archivo bajo `src/app/` | Responsabilidad y consumidores |
|---|---|---|
| 1 | `shared/design-system/_tokens.scss` | Paleta primaria, colores semánticos, altura/radio de controles y alias públicos. |
| 2 | `shared/design-system/_base.scss` | Tipografía, foco, `.literal`, `.skip-link` y movimiento reducido. |
| 3 | `shared/design-system/_forms.scss` | Botones, inputs, checkbox, textarea, labels, `.field-label` y contrato común de select nativo/PrimeNG. |
| 4 | `shared/design-system/_layout.scss` | `.section-heading`, `.toolbar`, `.actions`, `.search`, `.form-grid` y variantes móviles. |
| 5 | `shared/design-system/_feedback.scss` | `.count`, `.badge`, `.published`, `.danger`, `.error`, `.notice`. |
| 6 | `shared/design-system/_tables.scss` | Base `.p-datatable`, celdas, cabeceras y enlaces. |
| 7 | `shared/design-system/_primeng.scss` | Tokens de select, overlays, paginadores y selector compartido `.dwc-picker`. |
| 8–10 | `features/catalog/catalog.scss`, `features/profiles/profiles.scss`, `features/importer/importer.scss` | Sincronización/definiciones; editor/reglas; pasos/carga/contexto/mapeo/validación, respectivamente. |

Las excepciones compactas de mapeo se aplican después de las primitivas. Los cinco paginadores comparten `.p-paginator .p-select`; no hay estilos por instancia. El corte móvil continúa en 800px y los overlays mantienen el límite del viewport.

## Tokens y uso

- `--museum-primary-50` a `--museum-primary-950`: única escala primaria, con los valores del preset original.
- `--museum-text`, `--museum-text-muted`, `--museum-heading`, `--museum-link`: texto y jerarquía.
- `--museum-page`, `--museum-surface`, `--museum-line`, `--museum-table-heading`: superficies y separación.
- `--museum-error-{surface,border,text,line}`: errores de formulario, tabla y sincronización.
- `--museum-control-{height,border,radius}` y `--museum-button-border`: geometría y bordes compartidos.
- Se conservan `--pine`, `--ink`, `--muted`, `--line`, `--select-control-{height,border,radius}`, `--mapping-control-height` y `--p-primary-color` como alias. Las medidas particulares de cada funcionalidad permanecen junto a sus reglas; no se crea una escala sin consumidores.

Para añadir una acción, reutilizar `button` y `.actions`; para un formulario, `label` y `.form-grid`; para un selector DwC, el componente compartido existente y su clase `.dwc-picker`. No sustituir selects nativos ni duplicar su comportamiento.

## PrimeNG: misma paleta, no otra copia

`shared/design-system/museum.preset.ts` exporta `MuseumPreset`, construido con `definePreset(Aura, …)`. Cada tono primario referencia `var(--museum-primary-N)`; los hexadecimales solo viven en `_tokens.scss`. Los alias CSS también referencian esa escala. La flecha SVG del select conserva el color de texto secundario codificado en su URI, no otra escala primaria.

La integración en `app.config.ts` corresponde al cierre T4: importar `MuseumPreset` y usarlo como `theme.preset`, eliminando el preset inline y manteniendo `darkModeSelector: false`. T2 entrega el preset, pero no modifica esa configuración.

## Limpieza y comprobación

Se fusionaron las declaraciones repetidas de `.editor fieldset`, `.p-select-overlay`, `.p-select-option` y las celdas de mapeo; se eliminó el `display: flex` redundante de la especialización de sugerencias y la regla local de movimiento reducido ya cubierta por la global con `!important`. Se mantienen los overrides que sí expresan contexto (editor, mapeo, disabled, hover y foco).

`shared/design-system/design-system.spec.ts` compila la entrada global y comprueba paleta/preset, controles y overlays, selección/foco/filas, sincronización/movimiento y variantes móviles. Son comprobaciones de contrato CSS, no sustituyen mediciones de navegador. En T2 no se ejecutan pruebas ni build mientras se reubican TS/HTML en paralelo; la aceptación funcional queda pendiente de la ejecución serial y del navegador del padre.
