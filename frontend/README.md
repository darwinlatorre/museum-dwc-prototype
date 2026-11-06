# Área de trabajo de las colecciones del museo

Angular **21.2.25**, PrimeNG **21.1.10** y TanStack Query **5.104.5** permiten revisar archivos locales. La API almacena exclusivamente metadatos de catálogo y configuración global de validación. Los archivos, nombres de archivo, celdas y registros biológicos no se envían al servidor.

## Ejecución

Flujo principal: ejecutar `./start.sh` desde la raíz, con Node.js 24 y los requisitos del [README principal](../README.md#ejecución-local). Valida el único `.env` raíz, instala con `npm ci --no-audit --no-fund`, compila Angular y Spring y despliega `docker-compose.yml` esperando salud. El frontend no consume dotenv ni recibe credenciales de PostgreSQL.

Para desarrollo opcional, desde `frontend/`, ejecutar `npm ci` y luego `npm start`. Abrir http://localhost:4200. El proxy dirige `/api` a http://127.0.0.1:8080; iniciar primero el backend.

```bash
node scripts/check-architecture.mjs
npm test -- --watch=false
npm run build
```

El build genera `dist/frontend/browser`. El Dockerfile runtime `nginx:1.28-alpine` copia esa carpeta y el archivo hermano `dist/frontend/3rdpartylicenses.txt` sin recompilar fuentes. Las licencias quedan en `/usr/share/nginx/html/3rdpartylicenses.txt`, incluidas en la lista de permitidos del contexto. `nginx.conf` conserva `/api/` al enviar solicitudes a `backend:8080` y usa `index.html` como fallback SPA; el puerto publicado es solo `127.0.0.1:4200`. Su healthcheck usa wget y el inicio depende de la salud del backend. El contexto Docker excluye dotenv, fuentes y `node_modules`.

El MVP requiere un entorno local confiable: no implementa ni simula autenticación. OIDC/Keycloak es trabajo futuro.

## Analizar una colección: seis pasos

1. **Seleccionar archivo**: CSV UTF-8 separado por comas o XLSX. Para Excel, seleccionar explícitamente una pestaña y pulsar **Leer la hoja seleccionada**.
2. **Contexto**: elegir exactamente un radio obligatorio entre colección biológica, permiso de recolección o acceso a recursos genéticos, eventos de muestreo, marinos y otros. No hay selección implícita ni contextos combinables. Se utiliza la configuración global del servidor con su revisión real. La ausencia de encabezados obligatorios no bloquea el paso siguiente: primero se permiten equivalencias.
3. **Mapear columnas**: nombres exactos reconocidos sin cambios; sugerencias nunca automáticas. El selector DwC compartido permite texto libre, flechas/Enter, limpieza y deshabilitación. Limpiar retira la asignación explícita, no la columna ni el reconocimiento implícito del encabezado original. Los destinos deben ser únicos. Pulsar **Validar localmente** para diagnosticar los valores originales en el worker.
4. **Diagnóstico**: resumen por campo obligatorio con registros sin datos sobre el total. Distingue **Columna ausente** de **Valores vacíos**; cada fila se cuenta una vez por campo. Diez vacíos de `subfamily` entre doce registros muestran **10 de 12**. No se inventan ubicaciones para columnas ausentes.
5. **Normalizar**: consultar todos los registros por páginas de 10/25/50/100 y ventanas de hasta 50 columnas. Seis reglas siempre activas, sin interruptores, normalizan espacios exteriores, NULL/N/A como vacíos (sin distinguir mayúsculas), fechas, coordenadas y números, y comprueban duplicados. Este pedido explícito sustituye el opt-in anterior solo en Normalizar y Aplicar; el primer diagnóstico sigue siendo literal. Las fechas ambiguas y comas decimales requieren elección explícita; ver [reglas y cobertura](NORMALIZATION.md). Cada cambio parte del original y muestra el nombre de la regla. Hover, foco o activación/toque abre el original exacto; Escape o **Cerrar original** cierra sin reabrir al devolver foco. Flechas recorren celdas y Tab sale hacia la paginación. **Ocultar columnas sin datos** es solo presentación, incluida la restauración cuando todas quedan ocultas. Los dos criterios de duplicados muestran grupos y filas físicas por separado y pueden solaparse; nunca eliminan registros. **Aplicar normalización y validar** es explícito y se habilita solo con preview vigente sin error. Cambiar opciones invalida el diagnóstico, no aplica automáticamente. Los originales no cambian.
6. **Finalizar**: vacío por ahora; no guarda ni envía registros.

### Mapeo y diagnóstico compactos

El mapeo presenta las columnas con datos primero y las totalmente vacías o compuestas solo por espacios después, en una sola tabla. Un separador fino **Campos sin datos** se repite cuando una página comienza dentro de ese grupo. `NULL`, `N/A` y `0` cuentan como datos originales para ordenar. La presentación no cambia el índice físico de origen.

El conteo de vacíos abre un detalle único: campo y columna de origen una sola vez, filas físicas y valores originales; valores de trabajo solo si cambiaron. **Ver todas las incidencias** reemplaza ese detalle por el listado filtrable, nunca lo duplica. Abrir enfoca el encabezado sin salto vertical; cerrar devuelve el foco al disparador exacto. Cambiar entradas cierra los detalles. Las marcas `NULL`/`N/A` cuentan como datos en el diagnóstico inicial; solo tras **Aplicar normalización y validar** cuentan como faltantes. Entrar en Normalizar o cambiar formatos no actualiza ese diagnóstico.

Las descargas JSON/CSV siempre incluyen todas las incidencias, sin filtros ni límites de página. Su contrato es `{field,row,description,severity,context,configurationRevision}`. `context` es uno de los cinco elegibles o `system` para integridad básica. La revisión es la del snapshot analizado, no una revisión inventada al descargar. CSV protege celdas que podrían ejecutarse como fórmulas mediante un apóstrofo.

Las tablas resumen y detalle usan 10 filas iniciales; incidencias, 20. Ocultan paginadores cuando todo cabe en una página. La hoja de normalización mantiene sus controles de ventana con acciones deshabilitadas en los límites. El mapeo y catálogo conservan sus tamaños. Los selectores nativos y PrimeNG comparten tokens de geometría, foco y estados; no se reemplaza el comportamiento nativo.

El progreso permite volver sin perder archivo, equivalencias, contexto, opciones o diagnóstico vigente. Para mapear se requiere archivo leído, un contexto y configuración disponible; para los pasos posteriores, destinos únicos y validación terminada. Navegar no reinicia el worker. El workbench permanece montado al consultar configuración o catálogo. La franja de los seis pasos desplaza solo su eje horizontal tras renderizar el paso activo y al redimensionar la ventana; retira el listener al destruirse. El pie crece debajo del contenido, sin superponerse.

### Límites y originales

Hasta **10 MiB**, **50 000 registros**, **500 columnas** y **100 000 incidencias**. Se rechazan comillas mal formadas, anchos CSV inconsistentes, encabezados vacíos y duplicados equivalentes al ignorar mayúsculas o espacios.

Las filas CSV conservan líneas físicas, incluidas filas vacías y saltos dentro de comillas. XLSX conserva posiciones de la hoja y convierte fechas Excel a ISO; los huecos se completan sin desplazar registros. Un archivo y una hoja por vez. XLSX **no se descomprime incrementalmente**: el tamaño comprimido no garantiza el consumo de memoria. Si es necesario, cancelar o usar CSV más pequeño.

Cancelar procesamiento termina el worker de análisis. La preview usa otro worker persistente con original cacheado una vez por sesión; paginar u ocultar columnas no renormaliza ni invalida el análisis. Cambiar archivo/hoja/mapeo o destruir el workbench termina ese worker. Cancelar vista previa conserva la copia anterior etiquetada como no vigente; el reintento es manual. Error no habilita Aplicar ni provoca reintentos automáticos. La vista se ensancha únicamente mientras Normalizar está activo y visible en el menú; los demás pasos y secciones conservan su geometría base.

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
| `features/importer/workbench` | Navegación, generaciones, cancelación y worker |
| `features/importer/components` | Mapeo, contexto y presentación modular de normalización |
| `features/importer/engine` | Parser, normalizador, validador y exportación locales |
| `features/importer/models` | Dataset, límites, resultados y protocolo del worker |
| `core/api`, `core/i18n` | Metadatos y presentación |
| `shared/ui/dwc-picker`, `shared/design-system` | Selector, paleta única, primitivas y preset |
| `testing` | Composición y costuras entre funcionalidades |

Ver [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) y [QUERY_USAGE.md](QUERY_USAGE.md). Cliente Query raíz obtenido con `inject(QueryClient)`, no el alias deprecado. `fetch` propaga `AbortSignal`; ni archivos ni análisis entran en el query cache. El checker estructural no sustituye pruebas, build ni navegador.

## Versiones y licencias

PrimeNG **21.1.10** comunitario y `@primeuix/themes` **2.0.3** se distribuyen bajo MIT según sus archivos de licencia. No se usan versiones `-lts`, temas 3.x ni PrimeNG 22 con claves PrimeUI. Conservar avisos al redistribuir; no ocultar avisos ni modificar proveedores.

Angular/compiler/forms **21.2.25**, CDK **21.2.14**, CLI/build **21.2.27**, TypeScript **5.9.3**, Vitest **4.1.12**, Vite **7.3.6**. Los formularios de señales de Angular 21 son experimentales. TanStack Query **5.104.5** y `read-excel-file` **9.3.12** se conservan. Usar lockfile y `npm ci` para reproducibilidad.

La auditoría npm adicional agotó cinco minutos con código 124 y sin resultados; la limitación fue aceptada expresamente. No se presenta como aprobada ni se reintenta automáticamente. Consultar [VERIFICATION.md](../VERIFICATION.md) para evidencia histórica y actual: no sumar pruebas anteriores como una ejecución nueva.
