# Sistema de diseño del museo — sincronización de fuentes

Sistema existente, no propuesta. Fuentes leídas sin modificaciones. Los artboards son exploraciones de presentación; no amplían el modelo.

## Tokens

Fuente de todos los tokens de esta tabla: `frontend/src/app/shared/design-system/_tokens.scss`. Los alias se resuelven al valor de su referencia, no crean una paleta nueva.

| Grupo | Nombre (prefijo `--museum-`) | Valores en orden |
|---|---|---|
| Primarios (11) | primary-50,100,200,300,400,500,600,700,800,900,950 | #edf6f2; #d3e8de; #a9d0bd; #7ab497; #509578; #30785c; #235f48; #194c3a; #163e31; #143329; #0b211a |
| Texto (4) | text; text-muted; heading; link | #203a34; #526960; #1b3930; #23634d |
| Superficies/bordes (7) | page; surface; line; control-border; button-border; workspace-border; table-heading | #f3f6f5; white; #dce5e0; #aebfb6; #b8cbc0; #e0e8e3; #f1f5f2 |
| Navegación/pie (8) | nav-surface; nav-text; nav-muted; nav-accent; nav-link; nav-active; nav-divider; footer-text | var(--museum-primary-800); #e8f1eb; #b3cdbf; #b6d7bf; #d9e8de; #2b5744; #426653; #647a6e |
| Error (4) | error-surface; error-border; error-text; error-line | #fff1ed; #ae4030; #732b22; #edc7bb |
| Tipografía (1) | font-family | 'Segoe UI', Frutiger, 'Helvetica Neue', sans-serif |
| Espacios (8) | space-1,2,3,4,5,6,8,10 | .25rem; .5rem; .75rem; 1rem; 1.25rem; 1.5rem; 2rem; 2.5rem |
| Radios (5) | radius-sm; radius-md; radius-lg; radius-panel; control-radius | 4px; 5px; 6px; 8px; var(--museum-radius-md) |
| Altura (1) | control-height | 3.15rem |

49 tokens `museum` en total. Alias públicos (9): `--pine` → primary-700; `--ink` → text; `--muted` → text-muted; `--line` → line; `--select-control-height` → control-height; `--select-control-border` → control-border; `--select-control-radius` → control-radius; `--mapping-control-height` → select-control-height; `--p-primary-color` → primary-600.

## Valores locales existentes, no nuevos tokens

- `frontend/src/app/shared/design-system/_base.scss`: raíz 14px; h2 1.75rem, espaciado -0.04em; h3 1.35rem; h4 1.05rem; párrafos interlineado 1.6, ancho máximo 80ch; literal `white-space: pre-wrap`. Foco 2px primary-700, separación 3px. Movimiento reducido sin animación/transición.
- `frontend/src/app/shared/design-system/_forms.scss`: botón padding .55rem .8rem, interlineado 1.3; label .92rem/600; entrada padding .6rem .7rem; entrada mínima 39px; checkbox 18px. Select nativo y PrimeNG comparten altura 3.15rem, borde y radio. No sombra (`none`); no hay escala de sombras definida.
- `frontend/src/app/shared/design-system/_layout.scss`: toolbar #edf2ef; search máximo 440px; form-grid dos columnas, una a 800px. Espacios tomados de tokens.
- `frontend/src/app/shared/design-system/_feedback.scss`: badge #edf0eb/#d7ded5; published #e6f3ec/#bfdccd, texto primary-600; danger #913727/#fff0eb, borde error-line; notice #e9f3ed, borde primary-500 y texto primary-700. Son 7 colores locales adicionales.
- `frontend/src/app/shared/design-system/_primeng.scss`: option-focus #edf4ef; option-selected #e2eee6, texto primary-700. Overlay máximo calc(100vw - 2rem); texto envuelto; altura de opción igual a control. Son 2 colores locales adicionales.

## Reglas de componentes y propiedad

- `frontend/DESIGN_SYSTEM.md`: una entrada global, overlays fuera del host, breakpoint 800px. Reutilizar primitivas; no nueva paleta, tipografía o dependencia.
- `frontend/src/app/shared/design-system/museum.preset.ts`: MuseumPreset/Aura referencia los 11 tonos primarios CSS; no segunda copia de colores.
- `frontend/src/app/shared/design-system/_tables.scss`: cabecera table-heading, texto muted; borde line y radio lg; contenido alineado arriba.
- `frontend/src/app/shared/ui/dwc-picker/dwc-picker.ts`: selección editable, texto libre sin normalizar, limpieza, deshabilitación, filtrado por nombre y overlay. En los bocetos el input con datalist representa esta capacidad, no sustituye el componente productivo.
- `frontend/src/app/features/record-sources/validation-configuration.scss`: lista con separadores, texto literal envuelto, agregar con picker flexible; apilado a 800px.
- `frontend/src/app/features/record-sources/validation-configuration.ts` y `.html`: máximo 200 caracteres/campo y 500 campos combinados obligatorios/opcionales por contexto; no vacío, duplicado exacto rechazado entre ambas listas. El botón Obligatorio/Opcional conserva fila y foco, y Quitar retira el campo de la configuración; ambos estados se guardan completos y la búsqueda es solo visual. Cambio de fuente limpia entrada; revisión global, guardado completo explícito, actualización descarta borrador solo tras lectura correcta; errores conservan datos; guardas de salida incluyen entrada pendiente. Sin auto-save, historial ni activación.
- `frontend/src/app/core/i18n/localization.ts`: Colección biológica, Permiso, Muestreo, Marino, Otros. No se cambia Contexto en análisis.
- `backend/src/main/resources/data/validation-configuration.json`: revisión inicial 0; campos originales 30/22/10/15/8. Todos se muestran sin traducir ni reordenar su significado.

## Aplicación en las propuestas

Controles con mínimo 44px para interacción táctil; foco explícito también en inputs y summary; bordes de controles primary-700 para contraste no textual. Estas son decisiones de presentación del boceto, no tokens nuevos. Geometría de paneles y grillas propia de cada dirección. No sombras, animación ni colores nuevos.

Comprobación de paleta: las tres propuestas usan solo primary-50/600/700/800, text, text-muted, heading, page, surface, line, nav-text y error-surface/border/text de la tabla. La lámina del sistema también representa los restantes colores de origen y los 10 colores locales documentados. Única familia: museum-font-family. Desviaciones de color/familia: ninguna. La comprobación estructural no equivale a auditoría visual de navegador.
