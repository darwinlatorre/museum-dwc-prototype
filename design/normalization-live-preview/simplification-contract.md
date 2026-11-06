# Normalización compacta — contrato de la nueva evolución

Fuente autoritativa: `odd/tasks/normalization-simplification.md`, Specs S1–S5 y restricciones L2. Este contrato guía T2/T3; no certifica implementación. Sustituye **solo para esta evolución** las decisiones de defaults y vista de `contract.md` (histórico). No reabre el registro DwC, parsers de fechas/precisión, helpers puros ni funcionalidades cerradas.

## Alcance y defaults [S1]

Solo en **Normalizar** y al pulsar **Aplicar normalización y validar**, las seis reglas están siempre activas: eliminar espacios extremos, NULL/N/A vacíos sin distinguir mayúsculas, fechas Darwin Core, coordenadas decimales, valores numéricos Darwin Core y comprobar duplicados. No hay interruptores de reglas ni consentimiento OFF heredado en esta pantalla. El diagnóstico inicial sigue usando originales y los defaults de helpers compartidos no cambian. Aplicar continúa explícito: cambiar formatos o vistas nunca valida ni aplica automáticamente.

Fechas y separadores comienzan en `safe`. DMY/MDY y coma decimal requieren selección explícita en selects nativos con etiqueta y ayuda de ambigüedad. `03/04/2024` y `1,234` permanecen intactos en safe. Mantener el registro cerrado por destino DwC y todos los límites existentes: calendario, precisión literal, intervalos, zonas, rangos y unidades. No inferir tipos por apariencia; no coerción numérica de IDs, cambio de case, pérdida de ceros ni redondeo. Trim sigue siendo recorte extremo; originales inmutables, nunca limpieza interior. No tocar validación cruda ni `analysis.worker` para cambiar defaults compartidos.

## Vista y paginación [S2,S3,S4]

- Contrato de ventana de bajo nivel: `rowFilter?: 'all' | 'changed'`. Ausente equivale a `all`, compatible con consumidores existentes. La UI de Normalizar envía explícitamente `changed` al entrar; «Con cambios» es su default y «Todos» permanece a su lado, no escondido en un menú.
- `changed` significa al menos un `after !== before` literal en **cualquier columna fuente**, también oculta, no mapeada o fuera de la ventana de columnas. Un aviso de duplicado sin cambio de valor NO incluye una fila. No usar conteos de grupos como conteo de cambios.
- En cada cálculo, construir/cachear índices de filas modificadas en el snapshot **fuera del hilo principal**, junto con metadata ya existente. No devolver ese índice entero ni el dataset a la UI/Query. Reutilizar el cálculo que detecta cambios, no crear un segundo normalizador ni recorrer el dataset en cada página.
- Cambiar filtro reinicia offset/página; paginar usa el tamaño del conjunto elegido (`changedRows` o `totalRows`). Validar offset contra ese tamaño filtrado, conservando límites y normalización de ventana existentes. El offset cuenta posiciones en la vista; `sourceRow` y `columnIndex` siguen siendo identidades físicas del original, nunca índices de pantalla. No renumerar ni compactar datos.
- Filtrar, paginar y ocultar vacías solo consultan/materializan el snapshot: no recalcular reglas/duplicados, reenviar originales, invalidar diagnóstico ni revalidar. Original/mapping se transfieren una vez por sesión como ya está acordado.
- `hideEmpty` solo afecta presentación y usa metadata de TODAS las filas normalizadas, no solo las modificadas ni la página. Conserva la opción y su default vigente (apagada en el prototipo). No cambia igualdad, índices de cambio, datos o grupos. `columnIndices: []` conserva las filas y sus identidades; mostrar fila física incluso sin celdas visibles. No confundir todas las columnas ocultas con cero registros.
- «Todos» ofrece los 36 registros del ejemplo, no una muestra truncada; producción mantiene 10/25/50/100 por página y ventanas acotadas de columnas existentes. Conteos/rango vienen de la vista: vacío `0–0 de 0`, nunca `1–0`; primera página y última deshabilitan controles correspondientes. Todos con cero cambios sigue mostrando todos los registros; dataset vacío conserva ambos filtros y paginación vacía sin inventar filas.

## Ventana confirmada y concurrencia

Conservar tokens de sesión/generación/id y guardas latest-only actuales. La respuesta confirma la ventana completa, incluido `rowFilter` efectivo. Mientras llega una petición nueva, la tabla anterior conserva su filtro/rango **confirmados**, etiquetada como anterior; el filtro solicitado no puede renombrar filas viejas ni cambiar sus conteos como si ya hubieran llegado. Aceptar solo la última respuesta pertinente; rechazar páginas tardías de otro filtro, generación o sesión. Un cambio de formato invalida el cálculo, no los originales. Un cambio de vista no crea otra generación de normalización.

Carga inicial, cálculo pendiente, cancelación o error no equivalen a «Sin cambios». Conservar el último snapshot válido etiquetado anterior, cerrar detalle viejo y deshabilitar Aplicar durante cálculo/error según el contrato existente. Error mantiene originales y permite reintentar; no borrar registros ni mostrar éxito. La fixture HTML es síncrona e ilustrativa: no es implementación de este protocolo ni de carreras worker.

## Duplicados y vacíos [S2,S3]

Ambos criterios se calculan sobre el conjunto completo normalizado: todas las columnas para filas iguales, y occurrenceID efectivo exacto para IDs repetidos, ignorando solo blancos. Conservar reglas de grupos, comparación estructural e IDs exactos existentes. Son avisos sin borrar/fusionar. Pueden solaparse: mostrar grupos y filas afectadas por criterio sin sumar como si fueran personas/filas únicas.

Avisos globales siguen disponibles aunque `changedRows === 0`; no se filtran por página o columnas. «Con cambios» vacío muestra **Sin cambios**, avisos y CTA **Mostrar todos**. No retirar el acceso a Todos ni presentar «sin duplicados» por ausencia de cambios. Sin occurrenceID, conservar explicación existente y comprobación de filas completas.

## Presentación e interacción [S4,S5]

Hoja protagonista: título breve, barra «Con cambios / Todos» y «Ocultar columnas sin datos», conteo corto y tabla representativa al entrar. Sin introducciones largas, tarjetas de indicadores ni rediseño de shell/otros pasos. «Formatos y reglas» es disclosure inicialmente cerrado: contiene los dos selects, ayuda de modo seguro y lista de seis reglas sin switches. Duplicados en disclosure separado con resumen global. No quitar etiquetas, nombres accesibles ni ayuda de ambigüedad por reducir texto.

Fila física anclada, cabecera campo efectivo/original, scroll contenido en tabla, no body horizontal a 390px. Cambios llevan borde y nombre de regla además de color. Original/resultado exactos consultables con hover, foco o tap; símbolos de espacios son solo representación. Una región compartida, no modal, con `aria-controls`/`aria-expanded` en disparador. Escape desde fuera del panel conserva foco externo; desde dentro y Cerrar restauran foco a la celda sin reabrir. Cerrar al cambiar ventana/formato, no dejar originales de otra generación. Si desaparece el CTA de vacío al mostrar Todos, mover foco al botón Todos persistente.

Controles con objetivo mínimo 44px, foco visible, estados pressed/disabled accesibles y status `aria-live` breve; selects nativos, orden de teclado y reduced-motion conservados. Tokens/familia exclusivamente `design/system.md`, sin colores, sombras, fuentes ni dependencias nuevas. Ensanche solo Normalizar; no adoptar cabecera/nav simplificadas del prototipo como shell productivo.

## Fixture y decisión visual

`01-hoja-ancha.html` contiene 36 filas sintéticas: tres cambiadas inicialmente, cambios dispersos, formatos ambiguos seguros, IDs/case/ceros intactos y pareja sin cambios en filas físicas 36/37 con ambos avisos. La variante «Ejemplo sin cambios» representa una fuente ya normalizada con las mismas 36 filas; no desactiva reglas ni elimina registros. Todos los formatos se ilustran desde originales, no mediante el motor productivo.

Tradeoff: revisión de cambios inmediata y menos texto permanente; las reglas y elecciones avanzadas requieren un despliegue adicional, mientras Todos queda siempre visible. Se conserva identidad de artboard01 y alternativas02/03 históricas.

Fuente UX consultada: `python3 -B /home/dark/.agents/skills/ui-ux-pro-max/scripts/search.py 'progressive disclosure data tables' --domain ux`. Resultado aplicable: `ux-guidelines.csv`, **Responsive / Table Handling / Web**: contener tablas anchas con scroll horizontal en vez de desbordar el viewport. Coincide con esta hoja de escritorio/móvil; resultados Bulk Actions/Auto-Play Video no aplican y no se adoptan. Disclosure responde al brief S5 y a Forms & Feedback de la skill, no se atribuye falsamente a una coincidencia de búsqueda.

## Handoff y verificación pendiente

T2/T3 deben citar este contrato nuevo explícitamente; no copiar defaults OFF del contrato histórico. Cobertura de diseño: S1 reglas/defaults, S2 filtro exacto/índice/duplicados, S3 Todos/vacío/paginación, S4 hideEmpty visual, S5 copia compacta/disclosure/accesibilidad. Pendiente de padre: pruebas públicas RED/GREEN de worker/UI, ventanas confirmadas/carreras, revisión real Angular, teclado/390px y contraste visual. Aquí solo sintaxis JS y comprobación estructural de HTML/manifest/recursos/tokens: no aprobación funcional, de navegador ni nativa.
