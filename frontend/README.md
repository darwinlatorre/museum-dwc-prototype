# Área de trabajo de las colecciones del museo

Angular **21.2.25**, PrimeNG **21.1.10** y TanStack Query **5.104.5** permiten revisar archivos locales. La API almacena exclusivamente metadatos de catálogo y configuración global de validación. Los archivos, nombres de archivo, celdas y registros biológicos no se envían al servidor.

## Ejecución

Flujo principal: desde la raíz, ejecutar `docker compose --env-file .env -f compose.yml up --build -d --wait --wait-timeout 180`; ver [modos y requisitos](../README.md#ejecución-local). Compose construye y despliega los servicios esperando salud. Node.js 24 y `npm ci --no-audit --no-fund` se ejecutan dentro de la imagen, no en el host. El frontend no consume dotenv ni recibe credenciales de PostgreSQL.

Para desarrollo en contenedor: `docker compose --env-file .env.dev -f compose.dev.yml up --build -d --wait`. El manifiesto es autónomo e incluye PostgreSQL con volumen propio; `--env-file` sigue siendo necesario para interpolar el manifiesto, aunque el backend también use `env_file`. Angular CLI sirve el puerto `FRONTEND_PORT` (4200), con fuentes montadas y polling para hot reload. `proxy.docker.conf.json` dirige `/api/**` a `backend:8080`; se preserva el proxy del modo host. El frontend pertenece a `app` y, solo con el overlay Traefik, también a `proxy` (red externa `proxy` por defecto, configurable con `TRAEFIK_NETWORK`). Desarrollo con proxy añade `-f compose.traefik.yml` después de `-f compose.dev.yml`; su perfil opcional publica siempre `127.0.0.1:80:80`. Ambos modos usan el router/servicio fijo `museum`, hacia 80 en producción y 4200 en desarrollo: son alternativas, no rutas simultáneas en un mismo Traefik sin configuración manual. Ver el README principal.

El servicio Docker configura un único hostname adicional con `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=${TRAEFIK_HOST:-localhost}`. Se conservan los hosts locales nativos y se rechazan otros hosts; no se desactiva la validación. Angular CLI 21.2.27 expone `--allowed-hosts` solo como booleano: ni separar el hostname ni usar `=hostname` configura la lista deseada. La variable solo pertenece al servicio Docker, no a la aplicación ni al modo host.

Para desarrollo opcional, desde `frontend/`, ejecutar `npm ci` y luego `npm start`. Abrir http://localhost:4200. El proxy dirige `/api` a http://127.0.0.1:8080; iniciar primero el backend.

```bash
npm run lint
node scripts/check-architecture.mjs
npm test -- --watch=false
npm run build
```

`npm run lint` ejecuta ESLint directamente (no `ng lint`) sobre `src/**/*.ts` y `src/**/*.html`, incluidas las pruebas y plantillas inline de componentes. `eslint.config.mjs` usa flat config con las reglas recomendadas de ESLint, typescript-eslint y Angular ESLint, sin reglas de formato ni análisis que requiera información de tipos. Cualquier error o advertencia hace fallar el comando. Se ignoran `node_modules`, `dist`, `.angular`, `.cache` y `coverage`; los scripts JavaScript y estilos no forman parte de este lint. Prettier se mantiene separado para formato.

El Dockerfile multietapa instala dependencias en `base`, ejecuta CLI en `development` y compila en `build`. La última etapa `production`, seleccionada por defecto sin `build.target`, usa `nginx:1.28-alpine` y copia desde build `dist/frontend/browser` y el archivo hermano `3rdpartylicenses.txt`, disponible en `/usr/share/nginx/html/3rdpartylicenses.txt`. `nginx.conf` conserva `/api/` hacia `backend:8080` y el fallback SPA; producción publica solo `127.0.0.1:${FRONTEND_HTTP_PORT:-8081}`. El healthcheck usa wget y el inicio depende del backend saludable. El contexto permite fuentes y manifiestos, pero excluye dotenv, artefactos host y `node_modules`.

El MVP requiere un entorno local confiable: no implementa ni simula autenticación. OIDC/Keycloak es trabajo futuro.

## Navegación

`/analisis`, `/fuentes-de-registros` y `/catalogo` son rutas directas con título y
enlace activo accesible. `/` y las rutas desconocidas redirigen a `/analisis`.
Atrás/adelante usa el router; los seis pasos siguen siendo navegación local.
Un único layout mantiene el importador, archivo y workers al cambiar de sección.
Fuentes protege tanto cambios del borrador como texto aún no agregado: cancelar
conserva URL y entrada; aceptar descarta al salir. Cerrar la ventana conserva la
protección nativa. No hay guardas de autenticación.

## Analizar una colección: seis pasos

1. **Seleccionar archivo**: CSV UTF-8 separado por comas o XLSX. Para Excel, seleccionar explícitamente una pestaña y pulsar **Leer la hoja seleccionada**.
2. **Contexto**: elegir exactamente un radio obligatorio entre colección biológica, permiso de recolección o acceso a recursos genéticos, eventos de muestreo, marinos y otros. No hay selección implícita ni contextos combinables. Se utiliza la configuración global del servidor con su revisión real. La ausencia de encabezados obligatorios no bloquea el paso siguiente: primero se permiten equivalencias.
3. **Mapear columnas**: nombres exactos reconocidos sin cambios; sugerencias nunca automáticas. El selector DwC compartido permite texto libre, flechas/Enter, limpieza y deshabilitación. Limpiar retira la asignación explícita, no la columna ni el reconocimiento implícito del encabezado original. Los destinos deben ser únicos. Pulsar **Validar localmente** para diagnosticar los valores originales en el worker.
4. **Diagnóstico**: resumen por campo obligatorio con registros sin datos sobre el total. Distingue **Columna ausente** de **Valores vacíos**; cada fila se cuenta una vez por campo. Diez vacíos de `subfamily` entre doce registros muestran **10 de 12**. No se inventan ubicaciones para columnas ausentes.
5. **Normalizar**: empieza en **Con cambios**; **Todos** permite consultar el conjunto completo por páginas de 10/25/50/100 y ventanas de hasta 50 columnas. Seis reglas siempre activas, sin interruptores, normalizan espacios exteriores, NULL/N/A como vacíos (sin distinguir mayúsculas), fechas, coordenadas y números, y comprueban duplicados. Este pedido explícito sustituye el opt-in anterior solo en Normalizar y Aplicar; el primer diagnóstico sigue siendo literal. **Formatos y reglas**, cerrado inicialmente, contiene los selects nativos y ayuda para fechas ambiguas y comas decimales, que requieren elección explícita; ver [reglas y cobertura](NORMALIZATION.md). Cada cambio parte del original y muestra el nombre de la regla. Hover, foco o activación/toque abre el original exacto; Escape o **Cerrar original** cierra sin reabrir al devolver foco. Flechas recorren celdas y Tab sale hacia la paginación. **Ocultar columnas sin datos** es solo presentación, incluida la restauración cuando todas quedan ocultas. **Duplicados**, cerrado inicialmente, resume globalmente ambos criterios y permite consultar grupos y filas físicas; pueden solaparse y nunca eliminan registros. **Aplicar normalización y validar** es explícito y se habilita solo con preview vigente sin error. Cambiar opciones invalida el diagnóstico, no aplica automáticamente. Los originales no cambian.
6. **Finalizar**: vacío por ahora; no guarda ni envía registros.

La vista **Con cambios** considera todas las columnas fuente, incluidas ocultas/fuera de ventana; un aviso de duplicado sin cambio literal no añade filas. **Sin cambios** mantiene los avisos globales y **Mostrar todos**, cuyo foco pasa al botón Todos persistente. Cambiar vista reinicia página sin recalcular ni invalidar diagnóstico. Los conteos/rango describen la ventana confirmada (`0–0 de 0` si vacía); durante una petición se conservan filas y conteos anteriores con aviso de carga, nunca se renombran como la vista solicitada. Columnas vacías y duplicados usan siempre el dataset completo. Un cambio de formato conserva la vista elegida; un archivo/hoja/mapeo nuevo vuelve a Con cambios. Los valores de tabla son literales planos; el detalle exacto concentra la representación de espacios.

### Mapeo y diagnóstico compactos

El mapeo presenta las columnas con datos primero y las totalmente vacías o compuestas solo por espacios después, en una sola tabla. Un separador fino **Campos sin datos** se repite cuando una página comienza dentro de ese grupo. `NULL`, `N/A` y `0` cuentan como datos originales para ordenar. La presentación no cambia el índice físico de origen.

El conteo de vacíos abre un detalle único: campo y columna de origen una sola vez, filas físicas y valores originales; valores de trabajo solo si cambiaron. **Ver todas las incidencias** reemplaza ese detalle por el listado filtrable, nunca lo duplica. Abrir enfoca el encabezado sin salto vertical; cerrar devuelve el foco al disparador exacto. Cambiar entradas cierra los detalles. Las marcas `NULL`/`N/A` cuentan como datos en el diagnóstico inicial; solo tras **Aplicar normalización y validar** cuentan como faltantes. Entrar en Normalizar o cambiar formatos no actualiza ese diagnóstico.

Las descargas JSON/CSV siempre incluyen todas las incidencias, sin filtros ni límites de página. Su contrato es `{field,row,description,severity,context,configurationRevision}`. `context` es uno de los cinco elegibles o `system` para integridad básica. La revisión es la del snapshot analizado, no una revisión inventada al descargar. CSV protege celdas que podrían ejecutarse como fórmulas mediante un apóstrofo.

Las tablas resumen y detalle usan 10 filas iniciales; incidencias, 20. Ocultan paginadores cuando todo cabe en una página. La hoja de normalización mantiene sus controles de ventana con acciones deshabilitadas en los límites. El mapeo y catálogo conservan sus tamaños. Los selectores nativos y PrimeNG comparten tokens de geometría, foco y estados; no se reemplaza el comportamiento nativo.

El progreso permite volver sin perder archivo, equivalencias, contexto, opciones o diagnóstico vigente. Para mapear se requiere archivo leído, un contexto y configuración disponible; para los pasos posteriores, destinos únicos y validación terminada. Navegar no reinicia el worker. El workbench permanece montado al consultar configuración o catálogo. La franja de los seis pasos desplaza solo su eje horizontal tras renderizar el paso activo y al redimensionar la ventana; retira el listener al destruirse. El pie crece debajo del contenido, sin superponerse.

### Límites y originales

Hasta **10 MiB**, **50 000 registros**, **500 columnas** y **100 000 incidencias**. Se rechazan comillas mal formadas, anchos CSV inconsistentes, encabezados vacíos y duplicados equivalentes al ignorar mayúsculas o espacios.

Las filas CSV conservan líneas físicas, incluidas filas vacías y saltos dentro de comillas. XLSX conserva posiciones de la hoja y convierte fechas Excel a ISO; los huecos se completan sin desplazar registros. Un archivo y una hoja por vez. XLSX **no se descomprime incrementalmente**: el tamaño comprimido no garantiza el consumo de memoria. Si es necesario, cancelar o usar CSV más pequeño.

Cancelar procesamiento termina el worker de análisis. La preview usa otro worker persistente con original cacheado una vez por sesión; cambiar vista, paginar u ocultar columnas no renormaliza ni invalida el análisis. Cambiar archivo/hoja/mapeo o destruir el workbench termina ese worker. Cancelar vista previa conserva la copia anterior etiquetada como no vigente; el reintento es manual. Error no habilita Aplicar ni provoca reintentos automáticos. La vista se ensancha únicamente mientras Normalizar está activo y visible en el menú; los demás pasos y secciones conservan su geometría base.

Cambios de mapeo, opciones, contexto, términos o configuración global invalidan el diagnóstico y las respuestas de generaciones anteriores. Una revisión global nueva no puede reutilizar un resultado viejo. No hay configuración sintética de respaldo ante fallos de consulta.

### Comprobaciones básicas

Independientemente de los campos obligatorios, siempre se verifican los valores no vacíos:

- `eventDate`: calendario exacto `YYYY-MM-DD`.
- `year`, `month`, `day`: enteros válidos, bisiestos y coherencia con `eventDate`.
- `decimalLatitude`, `decimalLongitude`: decimales finitos dentro de ±90 y ±180.

Los valores opcionales vacíos se permiten. Columnas desconocidas generan advertencias del sistema y posibles equivalencias. El diagnóstico **no certifica una publicación SiB**; no se validan extensiones GGBN.

## Fuentes de registros biológicos

El administrador maestro-detalle muestra los cinco tipos de fuente con sus recuentos reales. Seleccionar una fuente abre su espacio de campos; agregar campos utiliza el mismo selector DwC del mapeo y los incorpora como obligatorios. El botón **Obligatorio / Opcional**, junto a **Quitar**, alterna el estado sin ocultar ni retirar la fila. Los opcionales permanecen guardados y visibles después de recargar; no generan incidencias por datos ausentes. **Quitar** elimina el campo de ambas listas configuradas de esa fuente, no del catálogo. Los recuentos muestran total, obligatorios y opcionales. La búsqueda filtra solo la presentación, permite limpiar o mostrar un estado sin coincidencias y nunca limita el guardado completo. Cambiar de fuente limpia la búsqueda y la entrada sin agregar, conservando los cambios ya agregados al borrador. El paso **Contexto** del análisis mantiene su nombre y funcionamiento. La búsqueda y la detección de duplicados incluyen ambos estados. No se duplican ni solapan campos dentro del contexto. Se permiten listas vacías explícitas, hasta 500 campos combinados por contexto y 200 caracteres por campo; no se permiten campos vacíos. Los espacios de textos válidos se preservan, sin recorte implícito.

**Guardar configuración** envía los cinco contextos completos con la revisión vigente. Un éxito confirmado actualiza la caché raíz e invalida el análisis. Un fallo HTTP 400, conflicto 409 o fallo de conexión conserva entradas y revisión locales y muestra el error real. **Actualizar del servidor y descartar cambios locales** sustituye el contenido únicamente tras una consulta correcta; si falla, conserva las entradas. Una revisión entrante no pisa cambios pendientes. Navegar fuera pide confirmación y cerrar la ventana activa la protección nativa de cambios sin guardar.

| Contexto | Campos iniciales | Particularidad |
|---|---:|---|
| `collection` | 30 | `disposition` opcional |
| `permit` | 22 | `disposition` obligatorio |
| `sampling` | 10 | Base más `eventID`, `eventDate` |
| `marine` | 15 | Base más requisitos marinos |
| `other` | 8 | Base común |

Son semillas del servidor según el pedido, no defaults productivos del cliente ni una interpretación alternativa del vocabulario TDWG. Los perfiles y sus ciclos de publicación/duplicación se retiran; el retiro de sus datos almacenados corresponde a la migración backend autorizada. No se ofrece consulta de historial legado.

### API: solo metadatos

- `GET /api/catalog`.
- `POST /api/catalog/sync`, cuerpo completamente vacío; resultado `{outcome,status}`.
- `GET /api/validation-configuration`.
- `PUT /api/validation-configuration`, cuerpo del editor `{revision: number, contexts: [{context, requiredFields: string[], optionalFields: string[]}]}`. Siempre envía ambas listas completas, aunque la búsqueda esté activa. GET devuelve ambas listas; las lecturas legadas sin `optionalFields` se presentan como `[]`. En PUT legado, omitir `optionalFields` conserva los opcionales almacenados; `[]` explícito los elimina. Las listas son disjuntas y preservan textos y espacios exactos. Exactamente los cinco contextos únicos; revisión obsoleta produce 409 sin cambios parciales.

No existe un endpoint de carga de archivos en este cliente. No se reintentan escrituras a ciegas tras fallos de transporte.

## Catálogo e idioma

Búsqueda, categoría y estado se combinan. **Restablecer filtros** muestra todos los términos. Las categorías muestran el último segmento de su URI como etiqueta pero conservan el valor canónico; **Sin categoría** no inventa una clasificación oficial.

**Sincronizar con TDWG** ejecuta una actualización real. El botón conserva ancho/altura, indicador y estados accesibles mientras se puede seguir filtrando. HTTP 200 no basta: se distingue `SUCCESS`, `FAILED` y `SUPERSEDED`. Al terminar se invalida solo catálogo; un fallo de transporte se informa como resultado no confirmado, sin afirmar que el servidor no hizo cambios.

Interfaz, ayudas y errores del sistema en español; claves JSON, `ERROR`/`WARNING`, contextos técnicos, términos Darwin Core, URI, nombres científicos y textos arbitrarios permanecen intactos. Las definiciones TDWG son citas en su idioma original, indicado en pantalla. Los errores se distinguen por texto, indicador y énfasis además del color.

## Arquitectura

| Módulo | Responsabilidad |
|---|---|
| `features/catalog` | Catálogo y contrato `Term` |
| `features/record-sources` | Editor global y modelos `ValidationConfiguration`, `ContextRequirements`, `Context` |
| `features/importer/pages/import-workbench` | Navegación, generaciones, cancelación y worker |
| `features/importer/components` | Mapeo, contexto y presentación modular de normalización |
| `features/importer/engine` | Parser, normalizador, validador y exportación locales |
| `features/importer/models` | Dataset, límites, resultados y protocolo del worker |
| `features/*/services` | Operaciones de metadatos según su propietario de negocio |
| `layouts/museum-layout` | Navegación enrutada, consultas y workbench persistente |
| `core/api`, `core/i18n` | Transporte genérico y presentación |
| `shared/ui/dwc-picker`, `shared/design-system` | Selector, paleta única, primitivas y preset |
| `testing` | Composición y costuras entre funcionalidades |

Ver [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) y [QUERY_USAGE.md](QUERY_USAGE.md). Cliente Query raíz obtenido con `inject(QueryClient)`, no el alias deprecado. `fetch` propaga `AbortSignal`; ni archivos ni análisis entran en el query cache. El checker estructural no sustituye pruebas, build ni navegador.

## Versiones y licencias

PrimeNG **21.1.10** comunitario y `@primeuix/themes` **2.0.3** se distribuyen bajo MIT según sus archivos de licencia. No se usan versiones `-lts`, temas 3.x ni PrimeNG 22 con claves PrimeUI. Conservar avisos al redistribuir; no ocultar avisos ni modificar proveedores.

Angular/compiler/forms **21.2.25**, CDK **21.2.14**, CLI/build **21.2.27**, TypeScript **5.9.3**, Vitest **4.1.12**, Vite **7.3.6**. Los formularios de señales de Angular 21 son experimentales. TanStack Query **5.104.5** y `read-excel-file` **9.3.12** se conservan. Usar lockfile y `npm ci` para reproducibilidad.

La auditoría npm adicional agotó cinco minutos con código 124 y sin resultados; la limitación fue aceptada expresamente. No se presenta como aprobada ni se reintenta automáticamente. Consultar [VERIFICATION.md](../VERIFICATION.md) para evidencia histórica y actual: no sumar pruebas anteriores como una ejecución nueva.
