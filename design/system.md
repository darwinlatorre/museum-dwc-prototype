# Sistema de diseño del museo

Sincronización S12 para `odd/tasks/collections-management.md`, T1. Sistema existente, no propuesta inicial. Fuentes productivas leídas, nunca modificadas. La referencia se vuelve a contrastar con `_tokens.scss`; no se introduce una paleta nueva.

## Tokens de origen

Fuente de **cada entrada** de esta tabla: `frontend/src/app/shared/design-system/_tokens.scss`. Prefijo `--museum-`; los alias conservan su referencia.

| Grupo | Nombres | Valores en orden |
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

**49 tokens museum**, incluidos 34 colores semánticos/primarios, y **9 alias públicos**: `--pine` → primary-700; `--ink` → text; `--muted` → text-muted; `--line` → line; `--select-control-height` → control-height; `--select-control-border` → control-border; `--select-control-radius` → control-radius; `--mapping-control-height` → select-control-height; `--p-primary-color` → primary-600.

## Valores locales verificados

No son tokens nuevos. Cada línea identifica su fuente bajo `frontend/src/app/shared/design-system/`.

- `_base.scss`: raíz 14px; h2 1.75rem/-0.04em; h3 1.35rem; h4 1.05rem; párrafos 1.6 y máximo 80ch; `.literal` usa `pre-wrap`. Foco de botones/enlaces 2px primary-700, offset 3px. Movimiento reducido desactiva animación, transición y scroll suave.
- `_forms.scss`: botón .55rem .8rem/1.3; label .92rem/600; inputs .6rem .7rem, mínimo 39px; checkbox 18px. Selects altura 3.15rem, radio md, sin sombra. Conservar selects nativos.
- `_layout.scss`: toolbar #edf2ef; search máximo 440px; form-grid dos columnas, una a 800px.
- `_feedback.scss`: badge #edf0eb/#d7ded5; published #e6f3ec/#bfdccd con texto primary-600; danger #913727/#fff0eb con error-line; notice #e9f3ed con primary-500/700.
- `_primeng.scss`: option-focus #edf4ef; option-selected #e2eee6, texto primary-700; overlay máximo calc(100vw - 2rem), opciones envueltas con altura de control.

Son **10 colores locales adicionales**, no una segunda paleta. No existe escala de sombras.

## Componentes y propiedad

- `frontend/DESIGN_SYSTEM.md`: entrada única `frontend/src/styles.scss`, estilos de funcionalidades globales para overlays, corte móvil 800px; reutilizar primitivas y picker DwC.
- `frontend/src/app/shared/design-system/museum.preset.ts`: MuseumPreset/Aura referencia los 11 primarios CSS; no copia hexadecimales.
- `frontend/src/app/shared/design-system/_tables.scss`: cabecera table-heading, texto muted, borde line, radio lg, celdas alineadas arriba.
- `_base.scss`, `_forms.scss`, `_layout.scss`, `_feedback.scss` y `_primeng.scss`: propiedad de tipografía/foco, controles, composición, mensajes y overlays respectivamente.

## Aplicación a Colecciones

Las láminas usan exclusivamente primarios 50/600/700/800, text, text-muted, heading, link, page, surface, line, table-heading, nav-text y error-surface/border/text. Única familia: la de origen. Geometría de composición propia, no tokens nuevos.

Decisiones de boceto: controles y summaries mínimo 44px, bordes de control primary-700, foco explícito en todos los controles y regiones desplazables. Tablas nativas con cabeceras sticky, scroll contenido y valores literales sin elipsis; en móvil se apilan paneles, nunca se eliminan columnas. Formularios y guardado explícito, sin edición oculta al perder foco. Sin sombras ni movimiento.

`design/system.html` muestra los 49 tokens por grupos (los alias se documentan aquí), los colores locales y primitivas. Las alternativas de Colecciones son **referencias de diseño locales**, no implementación ni prueba de persistencia. Los mensajes de resultado están rotulados como estados previstos; ningún archivo o registro se transmite. S2/S5 requieren trabajo backend posterior. La comprobación estructural no certifica geometría, teclado real ni conformidad AA en navegador.
