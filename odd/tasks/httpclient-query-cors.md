# HttpClient, Query y conexión directa
Rama: `refactor/httpclient-query-cors`, desde `dev`. Entrega: PR hacia `dev`, sin merge automático.
Verificación: Vitest/HttpTestingController, MockMvc CORS, lint/build, CLI y navegador aislados.

## Specs

- S1: «elimina la configuracion y codigo relacionado a la conexion del back que existe actualmente, has una limpienza».
- S2: «ahora utilicemos httpClient de angular y esto sincronizado con tankstak query para lo que sea necesario.»
- S3: «Realiza la configuracion de cors.»
- S4: «Re estructura el proyecto si es necesario para que se vea mas limpio.»
- S5: «Para esto crea una rama aparte de dev y por ultimo has el PR hacia dev.»
- S6: «Url directamente al backend, elimina el proxy pero crea variables de entorno para la configuracion de la url de la API y que sea facil de gestionar.»
- S7: «Elimina test como el de check-architecture.mjs».
- S8: «Elimina Query_USAGE».
- S9: «Elimina scripts relacionados y al final elimina los sctips que usaste solo para pruebas de ese momento».
- S10: «Si ves alguno que otro script por ahi que no se vaya usado y no se vaya a usar borralo.»
- S11: «La configuracion de cors en spring hasla por medio de WebMvcConfigurer. Elimina lo que creaste, no te compliques mucho.»
- S12: «Verifica si es necesario el nginx.conf, si no, eliminalo.»
- S13: «Ten en cuenta las variables de entorno y trabajalas de la siguiente manera, dentro de ella coloca lo la variable de entorno que es el link del backend, crea lo que son "application environments" de angular, configuralas, tiene que haber una de development y la otra normal. llamala "baseUrl: ..."»
- S14: «Vale entonces no tomes en cuenta el ultimo mensaje, y aprueba los cambios, cierra el issue y has el pr y apruebalo para dev. y termina.»

## Tasks

- T1 [S1,S2,S4,S6,S13] delegated/frontend — done — environments normal/development con baseUrl, HttpClient/Query conservados; 239 pruebas, lint y builds production/development aprobados. Commit: 60bdca4.
- T2 [S3,S11] delegated/backend — done — WebMvcConfigurer simple, sin filtro ni validador URI; 21 casos MVC aprobados, con RED 17 fallos contra implementación descartada. Commit: f84fe8c.
- T3 [S1,S4,S6,S12,S13] delegated/frontend + inline/integration — done — Sin proxies, runtime API_URL ni nginx.conf propio; Compose simple y 13 pruebas de CLI/hosts/empaquetado aprobadas. Commit: pendiente.
- T4 [S1,S2,S3,S4,S6,S11,S12,S13,S14] inline/checking + delegated/verify — dropped — Por aprobación de entrega en S14 no se continúa Docker/navegador final. Lint/239 frontend/13 Compose/21 MVC y 6 casos nuevos PASS conservados; timeout Docker 240 s no se considera aprobado ni se reintenta. Commit: evidencia en cierre.
- T5 [S5,S14] inline/delivery — in_progress — S14 autoriza commits, push, PR a dev y cierre explícito de issue #13; registrar límites. Sin merge. Commit: pendiente.
- T7 [S14] inline/GitHub-review — pending — Aprobar PR solo si GitHub permite a la cuenta actual revisar a un autor diferente; no simular autoaprobación ni cambiar credenciales.
- T6 [S7,S8,S9,S10,S13] inline/cleanup — done — Retirados checker, QUERY_USAGE, proxies, nginx.conf, runtime y helpers propios; logs conservados, copia temporal autorizada retirada. Commit: pendiente.

## Log

L1. Pedido original del usuario, literal:

> Ya realice el PR manualmente y quedo subida el .env.example
> Vamos a hacer lo siguiente, elimina la configuracion y codigo relacionado a la conexion del back que existe actualmente, has una limpienza, y ahora utilicemos httpClient de angular y esto sincronizado con tankstak query para lo que sea necesario. Realiza la configuracion de cors. Re estructura el proyecto si es necesario para que se vea mas limpio.
> Para esto crea una rama aparte de dev y por ultimo has el PR hacia dev.

L2. Aclaración del usuario, literal:

> Url directamente al backend, elimina el proxy pero crea variables de entorno para la configuracion de la url de la API y que sea facil de gestionar.

L3. Evidencia inicial: TanStack Query ya tiene un cliente raíz, claves estables y callbacks de invalidación. La fachada `core/api/api.ts` usa fetch; no hay CORS observado. Los proxies hoy atienden host, Docker y Nginx; S6 autoriza retirarlos deliberadamente. Preservar contratos existentes: POST de sincronización sin cuerpo, PUT completo/revisión, cancelación mediante AbortSignal, errores HTTP legibles, sin datos biológicos en HTTP/Query. No introducir httpResource ni un segundo caché junto a Query.

L4. Diseño inicial API_URL/runtime JSON descartado por S13. Diseño final: environments con baseUrl, conexión HTTP directa y CORS explícito para orígenes locales. No hay autenticación ni datos biológicos en HTTP; mantener localhost.

L5. Rutas: writers frontend/backend en paralelo, superficies disjuntas; integración y publicación del padre. Un PR a dev solicitado, commits por unidad. Presupuesto de unas 400 líneas orientativo, no omitir pruebas/minificar por tamaño. No inventar aprobaciones.

L6. Base limpia dev ebcf020; el humano publicó .env.example, que el agente no lee. No tocar dotenv/plantillas, datos ni servicios existentes. No repetir auditoría npm ni verificadores históricos.

L7. Rama desde origin/dev ebcf0207ba0c2e3783790b18442efd9e52a3d4d2. GitHub: labels status:approved/type:refactor existentes; sin issue aprobada abierta al consultar. Autorización resuelta en L17.

L8. Corrección del usuario, literal:

> Tambien intenta eliminar documentacion totalmente inecesaria
> 1. Elimina test como el de check-architecture.mjs
> 2. Elimina Query_USAGE
> 3. Elimina scripts relacionados y al final elimina los sctips que usaste solo para pruebas de ese momento
> 4. Si ves alguno que otro script por ahi que no se vaya usado y no se vaya a usar borralo.

L9. Corrección del usuario, literal:

> La configuracion de cors en spring hasla por medio de WebMvcConfigurer. Elimina lo que creaste, no te compliques mucho.

L10. Historia: RED contra fetch/generador ausente; runtime anterior 244 pruebas y filtro anterior 39 casos aprobaron. Ambos diseños se sustituyeron por S11/S13; esos resultados no acreditan el candidato final.

L11. S11 cumplida por backend: únicamente WebMvcConfigurer.addCorsMappings, property CORS_ALLOWED_ORIGINS igual, sin filtro/bean/source extra ni parser de URI/puertos. 21 casos MVC GREEN; rechazos sin efectos y GET/PUT/POST sin Origin conservados. No se promete cabecera CORS en 405 previo a mapeo, conforme a MVC simple solicitado. T1 frontend completo; T3/T6 integración y limpieza pendientes.

L12. Petición del usuario, literal:

> Verifica si es necesario el nginx.conf, si no, eliminalo.

Con runtime JSON se conservó nginx.conf por no-store y fallback SPA. Debe reevaluarse tras S13.

L13. Petición del usuario, literal:

> Ten en cuenta las variables de entorno y trabajalas de la siguiente manera, dentro de ella coloca lo la variable de entorno que es el link del backend, crea lo que son "application environments" de angular, configuralas, tiene que haber una de development y la otra normal. llamala "baseUrl: ..."

L14. Final: src/environments/environment.ts y environment.development.ts con baseUrl=http://localhost:8080/api; fileReplacements development. Son valores de compilación, sin dotenv ni runtime JSON/hooks/Node productivo. Browser anterior (GET directos 200, 414 términos y 30 campos) es histórico. Excluir reordenamiento ajeno de imports en ConfigurationService.java.

L15. Final frontend: 239/239, 17 archivos, 32 focalizadas, lint/builds normal y development PASS; bundle 668.59/500 kB. Retirados 7 casos JSON, añadidos 2 environments; 12 contratos HTTP conservados. routes=[]: Nginx predeterminado basta. Padre retiró nginx.conf y archivos runtime.

L16. Final integración: sin API_URL/helper/tmpfs; src read-only incluye environments. 13/13 Compose/CLI/hosts/paquetería PASS; CORS personalizado hereda env_file. ASSESS item 2 exige independiente; nativeRisk unassessable por untracked, sin revisión nativa. GitHub confirmó actor ADMIN.

L17. Autorizaciones humanas actuales: «Crear issue y aplicar status:approved», con Refs sin cierre automático, y «Autorizar copia temporal acotada» únicamente en /tmp/universidad-httpclient-verify-01a1be31, sin dotenv/datos reales. Raíz creada exclusiva con permisos 700. No reutiliza el permiso anterior de ESLint.

L18. Independiente actual mw9xt1qu-4-4gg2: lint, 239 frontend, 13 Compose, 21 MVC y 6 sondas nuevas PASS. Docker --network=none agotó 240 s en npm ci no cacheado; no se reintenta, navegador final queda pendiente. El padre rescató logs y retiró únicamente copia autorizada y helpers propios; no se incorporaron sondas temporales al código.

L19. Issue #13 creada/confirmada con status:approved y type:refactor: https://github.com/darwinlatorre/museum-dwc-prototype/issues/13 . Blank issues habilitadas, sin formulario ni duplicado HttpClient, actor ADMIN. Cuerpo revisado sin secretos/rutas personales, lectura posterior exacta; usar Refs #13. Espera decisión de aceptar límite Docker/navegador para PR o dejar entrega pendiente.

L20. Decisión final del usuario, literal: «Dejar la entrega pendiente». Se conserva la rama local refactor/httpclient-query-cors y sus cambios sin commit/push/PR. Issue #13 queda abierta. T4 conserva el límite de Docker/navegador; no se reintenta el verificador ni se ejecutan más comprobaciones. Reanudar publicación únicamente con nueva instrucción humana.

L21. Nueva instrucción vigente del usuario, literal:

> Vale entonces no tomes en cuenta el ultimo mensaje, y aprueba los cambios, cierra el issue y has el pr y apruebalo para dev. y termina.

S14 reabre entrega y acepta publicarla con los límites declarados, sin nuevas pruebas ni cambios de configuración. Se mantiene baseUrl de compilación. Cierre explícito de issue autorizado, sin auto-merge. Revisar identidad/autor: GitHub no permite aprobar el propio PR; no usar otra identidad ni afirmar aprobación nativa.

L22. Commits observados: f84fe8c CORS MVC (308 líneas cambiadas) y 60bdca4 HttpClient/environments (337). ASSESS committed-only de cada unidad volvió unassessable por archivos aún sin seguimiento; no hubo revisión ni aprobación nativa. Cuenta autenticada darwinlatorre, ADMIN; no PR previo para esta rama, issue #13 abierta/aprobada y origin/dev sigue ebcf020. Se preserva el import ajeno en ConfigurationService.java.
