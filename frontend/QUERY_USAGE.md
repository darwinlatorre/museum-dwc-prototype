# Uso de TanStack Query

## Veredicto y corrección

El uso actual es adecuado para los metadatos del MVP. Se corrigió la deprecación
real de `injectQueryClient()` sin cambiar transporte, políticas ni arquitectura.

Versiones instaladas: Angular core **21.2.25**, `@tanstack/angular-query-experimental`
y `@tanstack/query-core` **5.104.5** (sus respectivos `node_modules/.../package.json`).
La declaración instalada
`node_modules/@tanstack/angular-query-experimental/dist/inject-query-client.d.mts:8`
indica exactamente: `@deprecated Use inject(QueryClient) instead.`
Su implementación (`src/inject-query-client.ts:23`, dentro de ese paquete) obtenía
el token `QueryClient` del inyector. Se usa ahora `inject(QueryClient)` en
`src/app/features/catalog/catalog.ts:15` y `src/app/features/profiles/profiles.ts:26`,
en inicializadores con contexto DI válido y sin crear otro cliente ni un wrapper.

## Auditoría del flujo existente

- **Cliente y ciclo de vida:** `src/app/app.config.ts:12–14` proporciona un único
  cliente raíz. El proveedor instalado registra el token y llama `mount()`/
  `unmount()` al resolver/destruir el inyector (`node_modules/@tanstack/angular-query-experimental/src/providers.ts:25–33`).
  Las features no añaden proveedores propios.
- **Claves y activación:** `src/app/app.ts:16–25` define `['catalog']` y
  `['profiles']`, con frescura de 300000 y 30000 ms. Su identidad es estructural;
  no requiere conservar la misma instancia de array. Son lecturas globales sin
  parámetros dependientes: no necesitan un predicado `enabled`. Se cargan desde
  el shell independientemente de la sección visible, pues alimentan el workbench.
- **Funciones de consulta:** devuelven `Promise` y pasan el `AbortSignal` hasta
  `fetch` (`src/app/app.ts:18,23`, `src/app/core/api/api.ts:20–37`). **No se usa
  HttpClient ni un puente Observable**. HTTP no exitoso rechaza la promesa, en
  lugar de convertirse en datos exitosos para Query.
- **Separación lectura/escritura:** el shell usa `injectQuery`; perfiles y sync
  usan `injectMutation`. Crear, actualizar, duplicar y publicar comparten
  invalidación de `['profiles']` en `onSuccess`
  (`src/app/features/profiles/profiles.ts:59–67,120–138`). Sync invalida
  `['catalog']` en `onSettled`, incluso ante fallo de transporte, y distingue
  `SUCCESS`, `FAILED` y `SUPERSEDED`
  (`src/app/features/catalog/catalog.ts:16–31`). Las consultas activas del shell
  se vuelven a obtener; no se invalida la colección ajena.
- **Estados y reintentos:** las lecturas tienen un reintento y no se refrescan
  por foco (`src/app/app.config.ts:13`); el shell muestra carga/error y permite
  refetch explícito (`src/app/app.html:44–56`, `src/app/app.ts:26–29`). Las
  mutaciones de perfiles conservan el default sin reintentos automáticos;
  sync lo declara explícitamente. Los controles deshabilitan envío pendiente y
  muestran errores (`src/app/features/profiles/profiles.html:52,65–79,168`,
  `src/app/features/catalog/catalog.html:12–28`).
- **Privacidad y persistencia:** la API transporta catálogo y reglas/versiones
  de perfiles (`src/app/core/api/api.ts:39–58`), no archivos ni registros
  biológicos. No se configura un persister de Query. Archivos, filas y análisis
  permanecen en señales y workers del importador, fuera del query cache
  (`src/app/features/importer/workbench/import-workbench.ts:46–69,159–190,228–241`).

## Salvedades, sin cambios adicionales

- Perfiles lanza la invalidación sin esperarla: «Perfil guardado» confirma la
  escritura, no que la lista ya esté refrescada. Un refetch fallido puede dejar
  datos anteriores visibles junto al error del shell. No es una pérdida de la
  invalidación ni motivo para introducir actualizaciones optimistas.
- Un fallo de transporte de una escritura puede ser ambiguo respecto al servidor;
  perfiles solo invalida al confirmar éxito. Además, el texto genérico de errores
  HTTP «No se guardaron los cambios» (`src/app/core/api/api.ts:34`) no demuestra
  por sí mismo rollback para cualquier error. Conviene tratar estas situaciones
  en una tarea explícita de recuperación/UX, sin reintentar escrituras a ciegas.
- `Api.request` convierte también abortos en un error genérico de conexión y
  realiza una aserción de tipo JSON, no validación de esquema en ejecución.
  Se conserva ese contrato; no se detectó necesidad de cambiarlo para esta DI.
- SSR, persistencia, optimistic updates y opciones adicionales de caché no son
  requisitos automáticos para este MVP. Esta revisión no es una auditoría de
  seguridad ni una verificación con API viva o navegador.

## Evidencia ejecutada

Desde `frontend`, con el runner serial existente y sin modificar límites:

```text
npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs --include=src/app/testing/query-usage.spec.ts
```

RED con producción anterior: exit 1, **9 PASS / 1 FAIL**, exactamente
`expected 'class _Catalog {\n  terms = __vite_ss…' not to contain 'injectQueryClient'`.
La guarda es estructural sobre las clases compiladas: sustituir un alias DI
equivalente no tiene una diferencia funcional que pueda fallar por sí sola.
GREEN después del reemplazo: exit 0, **10 PASS**. Las nueve pruebas restantes
pasan antes y después: identidad/ciclo de vida e invalidación con refetch real
mediante TestBed y API simulada. No leen historia Git ni contactan el servidor.

Tres ejecuciones anteriores fueron fallos de preparación, **no RED esperado**:
dos con `ReferenceError: Cannot access '__vi_import_4__' before initialization`
(0 tests), y otra con metadatos de App sin resolver (10 fallidas). Se eliminó
el mock y se corrigió el setup asíncrono con `compileComponents()`.

- `node scripts/check-architecture.mjs`: exit 0, arquitectura correcta.
- `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs`:
  exit 0, **99 pruebas / 11 archivos PASS**.
- `npm run build`: exit 0; advertencia de bundle inicial **643.82 kB** frente
  al presupuesto de aviso de **500 kB**. No se cambiaron budgets.
- `git diff --check`: exit 0, sin salida.
