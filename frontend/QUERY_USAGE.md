# Metadatos globales con TanStack Query

Un único cliente raíz mantiene catálogo y configuración de validación. Archivos, nombres de archivo, filas, celdas, resultados y cambios de normalización permanecen fuera del query cache y de HTTP.

## Propiedad y consultas

`src/app/app.config.ts` proporciona el cliente. Las features lo resuelven con `inject(QueryClient)`, sin proveedores propios ni el alias deprecado `injectQueryClient()`. El proveedor registra `mount()`/`unmount()` al resolver/destruir el inyector.

| Clave | Lectura desde `app.ts` | Frescura |
|---|---|---:|
| `['catalog']` | `Api.catalog(signal)` | 300000 ms |
| `['validation-configuration']` | `Api.validationConfiguration(signal)` | 30000 ms |

Son metadatos globales sin parámetros dependientes: se consultan desde el shell independientemente de la sección visible. La identidad de claves es estructural, no depende de conservar el array. Las lecturas conservan un reintento y no se refrescan por foco. El shell muestra carga/error y permite refetch explícito; no fabrica configuración cuando falla la API.

Las query functions devuelven promesas y propagan `AbortSignal` hasta `fetch`. Un HTTP no exitoso rechaza la promesa; no se transforma en datos de éxito. No se añade HttpClient ni puente Observable.

## Escrituras y recuperación

El editor de `features/validation-configuration` usa `injectMutation` para enviar `{revision, contexts}` completo. Solo tras éxito:

1. Cancela consultas anteriores de configuración para que no pisen la respuesta guardada.
2. Actualiza `['validation-configuration']` con el snapshot devuelto.
3. Limpia el estado pendiente local y anuncia guardado confirmado.
4. Invalida esa misma clave y espera su refresco; catálogo queda intacto.

La revisión nueva llega al workbench montado e invalida diagnóstico/generación; las respuestas del worker anterior se ignoran. No hay actualizaciones optimistas. Los errores conservan el contenido y revisión del editor; una revisión entrante tampoco pisa cambios pendientes. La actualización explícita cancela consultas anteriores y fuerza una lectura con frescura cero. Solo una lectura correcta descarta los cambios; su error mantiene entradas y se muestra separadamente.

La sincronización TDWG conserva `injectMutation`, invalida `['catalog']` en `onSettled` incluso ante fallo de transporte y distingue `SUCCESS`, `FAILED` y `SUPERSEDED`. No cambia configuración. Las escrituras no se reintentan automáticamente; los controles bloquean envíos pendientes y muestran errores reales.

## Límites del contrato

- No se configura persister ni almacenamiento local de Query.
- Un fallo de transporte puede ser ambiguo respecto a una escritura del servidor. No se debe anunciar éxito ni reenviar a ciegas; actualizar antes de reintentar.
- El texto genérico HTTP «No se guardaron los cambios» no demuestra rollback para todos los posibles errores. El rechazo atómico por revisión 409 pertenece al contrato backend.
- `Api.request` conserva la conversión de abortos a error genérico de conexión y una aserción TypeScript del JSON, no validación de esquema en runtime.
- SSR, optimistic updates y persistencia no forman parte de esta tarea.

## Verificación

`testing/query-usage.spec.ts` comprueba identidad/ciclo de vida del cliente, AbortSignal, consulta fallida sin respaldo sintético, guardado con actualización/invalidation y aislamiento de catálogo, más los cuatro resultados de sincronización. `validation-configuration.spec.ts` ejercita controles públicos, fallos y retención de entradas. Las pruebas usan metadatos simulados del contrato L3, sin API viva.

Ejecutar desde `frontend/`:

```bash
node scripts/check-architecture.mjs
npm test -- --watch=false
npm run build
```

Los resultados concretos y las limitaciones de navegador/API se registran por el integrador en [VERIFICATION.md](../VERIFICATION.md). La evidencia histórica del reemplazo del alias DI no demuestra por sí sola el flujo global nuevo.
