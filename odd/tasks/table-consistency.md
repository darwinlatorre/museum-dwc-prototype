# Tablas coherentes y menú plegable
Objetivo: aplicar S1–S7 sobre la interfaz existente, sin reemplazar sus motores. Rama: feat/collections-management; continuación de la funcionalidad existente, sin integración en dev ni publicación.
Entrega: auto-chain / feature-branch-chain ya elegida; cortes revisables de comportamiento+pruebas+docs (~400líneas orientativas, previsión1200–2000). Node24, Vitestthreads/maxWorkers1/fileParallelismfalse; comprobaciones pesadas serializadas, Dockerdevexistente sin alterar.

## Specs
S1. «1. Intenta que la columna de acciones se distinga.»
S2. «2. Las columnas que tengan filtros para ordenar, la columna de fila ordenala por defecto de menor a mayor»
S3. «3. para toda la tabla hace que se use todo el espacio de la pagina»
S4. «4. Intetna que las tablas salgan de una y que posiblemente sean recursos reutilizables, es decir no volvas a crear una tabla si por ejemplo en normalizacion ya se hizo. (Que se cree una familiriadidad de como ves y lees tablas).»
S5. «5. Hace que el menu lateral se pueda esconder cuando el usuario lo prefiera, encontra un recurso bastante minimalista para hacer esto sin texto.»
S6. «6. Quita tanto texto explicativo, inecesario.»
S7. Decisión de alcance ante «Para ordenar por las columnas, ¿querés que se ordene todo el conjunto o solo la página visible? Recomiendo todo el conjunto: así “Fila” queda de menor a mayor también al pasar de página.»: «Todo el conjunto (recomendado)».

## Tasks
T1 | S1,S2,S4 | padre: primitivas compartidas de cabecera/orden y estilos | in_progress | sin commit; RED/GREEN y contratos previos del sistema de diseño pendientes.
T2 | S1,S2,S4,S6,S7 | escritorA: orden global Colecciones API/JPA y hoja | pending | después de T1; pruebas públicas PostgreSQL aislado y frontend.
T3 | S2,S4,S6,S7 | escritorB: orden global Normalizar en worker persistente | pending | después de T1; sesiones/ventanas/Aplicar y valores literales preservados.
T4 | S2,S3,S4,S5,S6,S7 | padre: resto de tablas, ancho del shell y menú plegable | pending | reutilizar T1; cambios de navegación solo de presentación.
T5 | S1–S7 | padre + verificador independiente: costuras, pruebas, navegador y cierre | pending | incluye documentación/commits locales; ninguna publicación autorizada.

## Log
L1. Pedido original: «1. Intenta que la columna de acciones se distinga.
2. Las columnas que tengan filtros para ordenar, la columna de fila ordenala por defecto de menor a mayor
3. para toda la tabla hace que se use todo el espacio de la pagina
4. Intetna que las tablas salgan de una y que posiblemente sean recursos reutilizables, es decir no volvas a crear una tabla si por ejemplo en normalizacion ya se hizo. (Que se cree una familiriadidad de como ves y lees tablas).
5. Hace que el menu lateral se pueda esconder cuando el usuario lo prefiera, encontra un recurso bastante minimalista para hacer esto sin texto.
6. Quita tanto texto explicativo, inecesario.»
L2. Elección humana: «Todo el conjunto (recomendado)». Exploración mwlme4dd-9-lwtt: tablasPrimeNGlocales, Normalizarworker/ventanas50, Coleccionesservidor/ventanas25; store actualordenaUUID. Reusar presentación y cabecera, no un grid que posea datos ni transporte. No reemplazar motores ni ventanas. Diseñoexistente vigente; no nuevos artboards/canvas para este pedido de implementación.
L3. Defaults de implementación, no requisitos adicionales: orden de texto literal por punto de código Unicode (PostgreSQLCOLLATE C / comparación pura frontend), sin trim/coerción/casefold; vacíos/missing al final en ambas direcciones, espacios y0 conservados. Fila numérica con empate estable (sourceindex/UUID); en incidencias el encabezado precede las filas. Colecciones usa orden de campo efectivo por literal de campo y dirección validada; queriesJPA parametrizadas, sin concatenación de entradas. Normalizar ordena índices en worker antes de recortar ventana/página y no recalcula ni reenvía originales por ordenar; ordenar no equivale a Aplicar. Preferencia de menú durante sesión de shell, no nuevo almacenamiento. Ancho disponible sin límite1500px; scroll contenido y altura natural, no filas artificialmente estiradas. Se conserva ayuda accesible/consentimientos/errores/incertidumbre, se quita prosa repetida.
L4. Estado previo: HEAD522cf8e, dirty propios VERIFICATION.md yodd/tasks/collections-usability.md con verificación adicionalRisk3aprobada4/4. Preservarlos y cerrar su evidencia por separado, sin mezclar con código nuevo. Último slice RDDpendiente c843ecd→522cf8e:969líneas/under_budget, independiente cumplido, no aprobación nativa. No lectura dotenv/start-dev, ni detener/reiniciar servicios, ni tocar datos existentes. Tests backend solo PostgreSQL desechable. RAM escasa: /tmp es tmpfs; verifier usa payload completo noGit en/var/tmp ythreads; no copiar raíz protegida ni modificarharness. EspejoEngram puede seguir pendiente por error de registro conocido; fuente local autoritativa.
