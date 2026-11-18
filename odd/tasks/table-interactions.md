# Edición mínima y columnas ajustables
Estado: implementación autorizada; rama feat/collections-management, base 718144391488c99e7ad4aef620be00c1ad333dd5.
Continuidad: este archivo es la especificación; no reabrir table-consistency ni mezclar datos/motores de Normalizar y Colecciones.

## Specs
S1. «1. Cosa quiero que cuando de click a una celda en colecciones, no se abra-agrande el recuadro y no aparezcan las celdas de guardar celda o cancelar y el texto
 descriptivo, la idea es que cuando de doble click se abra ese mismo espacio con ese mismo tamaño y deje modificar el texto desde ahi mismo sin abrir un textarea grande y
 si lo vas a hacer que sea del mismo tamaño y bastante minimal.»
S2. «2. Has que los tamaños sean ajustables de cada columna, en todas las tablas.»
S3. «3. Agrega una separacion y ordena los botones y la interfaz en colecciones, desde la forma en como se selecciona una a como se ven los botones, dentro de la coleccion,
 tambien encuenta una forma mas UX de ver los botones y los texto, usa por ejemplo la skill de ui/ux (Lo mismo aplica en normalizar).»

## Tasks
T1 | S2 | escritor A: resize compartido y catálogo/mapeo/tres tablas diagnóstico, código+pruebas+DS docs | in_progress | pendiente; paralelo independiente, >100 líneas/several minutes.
T2 | S1,S3 | escritor B: editor compacto y UX Colecciones/Normalizar, código+pruebas+docs | pending | pendiente; paralelo independiente de T1, >100 líneas/several minutes, worktree aislado.
T3 | S2 | padre: integrar contrato compartido resize en Colecciones y Normalizar; costura | pending | depende de T1/T2; no delegación adicional por tamaño.
T4 | S1–S3 | padre + verificador por riesgo4: pruebas, navegador real, evidencia y cierre local | pending | pendiente; no publicación.

## Log
L1. Pedido original literal:
1. Cosa quiero que cuando de click a una celda en colecciones, no se abra-agrande el recuadro y no aparezcan las celdas de guardar celda o cancelar y el texto
 descriptivo, la idea es que cuando de doble click se abra ese mismo espacio con ese mismo tamaño y deje modificar el texto desde ahi mismo sin abrir un textarea grande y
 si lo vas a hacer que sea del mismo tamaño y bastante minimal.
 2. Has que los tamaños sean ajustables de cada columna, en todas las tablas.
 3. Agrega una separacion y ordena los botones y la interfaz en colecciones, desde la forma en como se selecciona una a como se ven los botones, dentro de la coleccion,
 tambien encuenta una forma mas UX de ver los botones y los texto, usa por ejemplo la skill de ui/ux (Lo mismo aplica en normalizar).
L2. Exploración mwmmablh-h-dhgd: siete tablas, cabecera común existente; Colecciones ya abre con doble clic de ratón pero toque pointerup sí abre; editor fuerza20rem/textarea4rem y botones visibles. Lectura no reproduce síntoma de clic; reproducir en navegador antes de contrastar cambio. Guardar celda usa PUT de registro completo vía save/mutate, con valores de columnas ocultas. Mantener Enter sin Shift/IME para guardar, Escape descarta, blur no envía ni descarta, actualizaciones autoritativas, revisión, advertencias/consentimiento, bloqueos y no reenvío incierto. No nueva semántica de persistencia. Teclado/toque deben conservar camino accesible sin invadir celda con acciones; formulario completo explícito puede mantenerse.
L3. Skills gentle-design/gentle-ui-design/ui-ux-pro-max cargadas; system.md actualizado, diseño actual existente, se pide implementación, no tres artboards nuevos. Usar composición/feedback y adaptación: una acción primaria, grupos por intención y separación, no panel por cada control; tablas con scroll contenido. Búsqueda UX toolbar/primary-secondary no dio match específico fiable; para jerarquía se usa guía composition-and-feedback, no se finge resultado. Match verificado Dragging Movements exige alternativa de puntero simple y teclado (no solo arrastre): control numérico/pasos además de flechas. Resize presentacional local por clave estable, sin API/Query/worker ni originales reenviados, sin persistencia nueva. Respetar sticky, columnas condicionales y ventanas25/50, sin doble motor PrimeNG/nativo.
L4. Enrutamiento: dos unidades independientes reales T1/T2 con worktrees aislados. A no modifica Colecciones/Normalizar ni importer.scss; B no modifica shared resize, catálogo/mapeo/diagnóstico. import-workbench.html puede tener hunks independientes (A diagnóstico, B footer) en worktrees separados; el padre integra y comprueba. No writer para pruebas/docs aparte. Tests RED→GREEN por regla, regresiones existentes tocadas, no cambiar evolution.spec.ts (restricción humana previa). Node24 y Vitest threads/1worker/fileParallelismfalse; heavychecks serializados con flock. Sin reinstalar herramientas ni tocar harness/dotenv/start-dev.sh/.pi. .pi/ apareció untracked antes del pedido: preservar sin leer/editar/versionar.
L5. Alcance: frontend y docs; no backend ni migraciones ni reinicio de servicios autorizado por este pedido. Docker dev existente4200/8080/5432 y datos sintéticos; navegador propio con capturas dentro.browser, inspeccionarlas y cerrar al terminar. No tocar datos ajenos; pruebas de escritura aisladas por HttpTestingController o registro sintético propio con evidencia expresa. Sin push/PR/merge. No repetir auditoría npm aceptada pendiente ni suites backend sin cambio.
L6. Previsión1500–2300 líneas authored; estrategia ya elegida en esta misma rama: auto-chain/feature-branch-chain, cortes funcionales revisables alrededor400 como guía, no cap ni minificación. Unidad A podrá dividir mecanismo/integración, B editor/UX según coherencia; el padre hace commits locales, workers entregan sin commit. Nuevo riesgo4 por gestos/editor/lecturas asíncronas y limpieza de listeners: comprobación técnica independiente después de integrar, no sustituible por inspección visual. Nativa solo por switch y assess/reviewDue, sin inventar aprobación ni consentimientos. Mirror Engram intentado antes de primera escritura fuente; error conocido de registro no autoriza reparación del harness.
