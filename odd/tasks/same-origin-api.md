# API de mismo origen
Objetivo: aplicar la propuesta aceptada de proxy Angular/Nginx; rama `feat/same-origin-api` desde `dev`.
Entrega: cadena autorizada en `dev-pr-delivery.md`, PR21→20→19→18→dev, sin merges; pruebas Python Compose, Angular y aceptación UI manual con límites.

## Specs

- S1: «entonces aplica estos cambios a la arq» — aceptación de la propuesta transcrita en L2; implementar `/api` relativo y proxy en ambos modos.
- S2: «que cambios me recomendarias para que las peticiones pasen dentro del contenedor? tener el proxy que sirva al front?» — comprobar el paso de peticiones por el servidor frontend, no conexión directa del navegador a 8080.
- S3: «pero porque debo tener un fw am back? no es suficiente con el front? en casl de que quiera exponer el 4200 con tailscale que hago tambien expongo el 8080?» — comprobar acceso a metadatos usando solo el puerto frontend; no configurar ni exponer Tailscale/Funnel.

## Tasks

- T1 [S1–S3] Implementación, pruebas RED/GREEN y documentación del proxy; ruta worker por context backstop; estado done; RED/GREEN observados, pruebas y docs en commit250da44, PR #21.
- T2 [S1–S3] Verificación independiente de configuración y runtime aislado; ruta verify; estado done; Compose14/14 y Nginx79 aserciones PASS; comprobación final independiente104inputs idénticos,lint/249tests/build PASS. UI propia no ejecutada por OOM, aceptación manual L11; sin atribuirla al agente. Commit250da44.
- T3 [S1–S3] Cierre de evidencia y entrega revisable; ruta padre; estado done; PR #21 publicado como hijo de #20, commit250da44. Tracker #18 sigue borrador a dev; sin merges ni aprobación nativa.

## Log

- L1: Pedido original: «entonces aplica estos cambios a la arq».
- L2: Propuesta inmediatamente anterior aceptada: «Sí: te recomiendo un **proxy de mismo origen**, sin necesidad de Traefik.

```text
Navegador → frontend
               ├── /          → Angular
               └── /api/...   → backend:8080 → PostgreSQL
```

Los cambios serían:

1. **Angular:** usar `baseUrl: '/api'` en ambos environments.
2. **Desarrollo:** configurar el proxy de Angular CLI para derivar `/api` a `http://backend:8080` dentro de Docker.
3. **Imagen compilada:** configurar Nginx para servir Angular y derivar `/api` al mismo backend.
4. **Compose:** conservar la red interna. El navegador ya no necesitaría acceder directamente al puerto 8080.

**Resultado:** reenviás únicamente **4200 en desarrollo** o **8081 en la imagen compilada**. Las llamadas a la API pasan por el servidor frontend y desaparece el cruce de orígenes que provoca CORS.

Mantendría CORS restrictivo y documentaría cómo ejecutar el frontend fuera de Docker. Esto cambia deliberadamente el contrato actual de “sin proxy API”; todavía no apliqué nada.»
- L3: Invariantes preservadas: SERVER_PORT configurable y sincronizado, CORS restrictivo sin cambios de backend, SPA fallback, licencias, localhost, volúmenes, privacidad y cancelación Query. No leer/modificar dotenv reales ni plantillas. Sin acceso a datos vivos durante pruebas; recursos sintéticos aislados. No reintroducir Traefik ni exponer servicios externos.
- L4: Diseño técnico: proxy CLI CJS con destino servidor configurable y default host localhost:8080; Compose development entrega backend:SERVER_PORT y monta config read-only. Nginx usa plantilla estándar de la imagen oficial y BACKEND_PORT, sin hooks propios ni runtime config del cliente. La URL cliente permanece `/api` en ambos modos. Mantener /api en upstream, errores JSON sin fallback SPA y tiempos de sincronización existentes.
- L6: Worker mwbbnif8-7-s13x completó T1: RED Python y environments observados; 13/13 Python Compose, 249/249 Angular con configuración serial local, lint y build exit 0. Bundle 677,45 kB advierte sobre 500 kB, no fallo. Incremento 264 líneas autorales, sin commits. ASSESS aún no obtiene candidato por selección de untracked pendiente; no se infiere reviewDue ni aprobación. Verificación independiente pendiente.
- L7: Verificador mwbbznav-8-chsf leyó el contrato y diff, pero preparación falló antes de probes: nginx:1.28-alpine y python:3.13-alpine no estaban disponibles y su rol prohíbe pull. Cero pruebas independientes/HTTP/Nginx ejecutadas. No se relanza ni sustituye. Padre preparó las dos imágenes mediante job-4 (exit 0); se necesita autorización humana para una nueva ejecución acotada de gentle-ai-verify y comprobación navegador pendiente. No hay evidencia de defecto de código. No se reinició el stack vivo ni se accedió a dotenv; requiere recrear frontend para nueva config/env/montaje, no solo recargar navegador.
- L8: Humano: «Autorizo.». Nuevo intento acotado de verificación independiente y navegador autorizado. Lista de tareas de subagentes confirma todos finalizados, sin hijo activo o incierto. Imágenes nginx:1.28-alpine/python:3.13-alpine disponibles; 78 GiB libres en proyecto y 3,8 GiB en /tmp. Se preserva el intento previo fallido con cero pruebas; no se reinician presupuestos de revisión nativa.
- L9: Nuevo independiente mwbc9vpw-9-z9lr PASS: 13/13 Python (8,978 s), Nginx oficial con puertos 8080/18080, 22 solicitudes y 79 aserciones; nginx -t, plantilla, errores JSON, prefijos, query/PUT y upstream fijo conformes. Sin bloqueadores; recursos propios retirados. Evidencia exacta en /tmp/same-origin-verify-7IYC3B, sin copiar ni alterar pruebas del repo.
- L10: Preparador mwbcdud0-a-vzrc intentó runtime completo aislado. PostgreSQL inició, pero Maven/backend real terminó OOMKilled=true, exit137, límite512MiB; ningún frontend se creó, cero pruebas navegador y ningún HTTP200 observado. Host tiene ~1461MiB disponibles, sin swap; no se aumenta memoria ni se reintenta a ciegas. Padre comprobó etiquetas exclusivas y retiró backend, db y red propios museum-origin-browser-1626c4e6, preservando universidad-dev. Logs/manifest en .browser/same-origin-api/browser-runtime. La prueba UI aún falta: requiere decisión sobre usar API activa solo lectura con frontend temporal o aportar recursos para aislamiento completo. Sin nueva ejecución independiente necesaria: esa parte ya PASS. No se declara cierre/commit/publicación.
- L11: Humano: «Para siguientes situaciones haslo asi, pero ya por este momento ya lo verifique y si funciona.». Aceptación manual actual registrada: no se hacen más pruebas. La verificación independiente sí pasó; la prueba de navegador del agente no ocurrió y no se inventa. Preferencia futura: frontend temporal contra API activa solo para lecturas, sin reinicios ni duplicación de backend/base; cualquier prueba que escriba datos sigue aislada. Se cierra seguimiento de implementación y evidencia, sin declarar aprobación nativa, despliegue automatizado, commits o publicación. El stack vivo no fue recreado por el agente; funcionamiento reportado por el humano.
- L5: Estado inicial: siete archivos modificados del retiro Traefik anterior preservados en `.browser/same-origin-api/before/`; `.playwright/` incidental permanece sin seguimiento y fuera del alcance. No incluir esos cambios silenciosamente en un commit nuevo. Pronóstico de esta unidad: alrededor de 350 líneas autorales, sujeto a medición; la base anterior no se publica ni integra automáticamente. Riesgo item 5 (entorno y proxy), item 2 (frontera de solicitudes); requiere verificación independiente. No se cambian perfiles AppArmor.

- L12: Entrega posterior autorizada en odd/tasks/dev-pr-delivery.md: commit250da44 y PR21 publicados y confirmados sobre la rama de PR20; tracker18 hacia dev. Comprobación independiente final en workspace original:104inputs por árbol idénticos/inmutables,lint/249tests/build0 en104,565s dentro de240s. El timeout anterior sigue histórico y sin causa probada; no se atribuye éxito a Docker. ASSESS final medium/reviewDuefalse,sin aprobación nativa. Sin merge,rootoriginal y .gitignoreajeno preservados. Advertencia bundle y auditoría pendiente aceptada permanecen.
