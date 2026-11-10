# Evidencia de verificación del MVP

## Limpieza de arranque y configuración ESLint

- `start.sh` retirado por pedido explícito. `scripts/test_start.py` se reemplaza por `scripts/test_compose.py`: eliminadas seis pruebas exclusivas del wrapper, sus constantes/stubs y aserciones decorativas de banners; permanecen **13 pruebas** de Compose, almacenamiento, redes, credenciales, empaquetado/licencias y regresión real CLI/HTTP de hosts. No se borraron pruebas de producto ni datos.
- Los proxies se conservan deliberadamente: host usa `proxy.conf.json` con destino `localhost:8080`; desarrollo Docker usa `proxy.docker.conf.json` con destino DNS `backend:8080`. No son duplicados equivalentes. Se retiraron instrucciones activas del wrapper en README, AGENTS y READMEs de componentes. No se encontró un Markdown completo cuya inutilidad estuviera demostrada: se preservan arquitectura y referencias históricas, sin agregar documentos nuevos de explicación.
- ESLint plano en `frontend/eslint.config.mjs`, script `npm run lint`, dependencias y lockfile coherentes: **eslint 10.14.0**, **@eslint/js 10.0.1**, **typescript-eslint 8.72.1**, **angular-eslint 21.4.0**. Pares y engines consultados mediante npm; compatibles con Node 24, TypeScript 5.9.3 y Angular CLI 21.2.27. ESLint 9 se reemplazó antes de entregar al advertir su fin de soporte; no se cambió Angular ni ninguna dependencia productiva.
- RED ESLint: `npm run lint` falló por script ausente. Configuración recomendada encontró cuatro elementos sin uso en `import-workbench.spec.ts`; se retiraron solo esos elementos, sin cambiar aserciones ni lógica productiva. GREEN con ESLint 10: cero hallazgos. Pruebas focalizadas de ese spec: **47 PASS**; build Angular **PASS**, con la advertencia previa de bundle **649.97 kB / 500.00 kB** intacta. Esos dos últimos comandos fueron observados por el writer antes de alinear únicamente ESLint 9→10; no se atribuyen a una suite integral nueva.
- Contraste integrado del padre: **exit 0**, `npm run lint`, checker de arquitectura, `npm ls` de las herramientas, sondas TS/HTML/inline e ignores y `python3 -B scripts/test_compose.py` **13/13 PASS** en 15.545 s; ausencia del wrapper/archivo anterior y `git diff --check` también aprobados. Las sondas provocan y rechazan infracciones reales con exit 1 esperado, sin dejar fixtures; prueban TS, HTML y plantilla inline, y exclusiones de node_modules/dist/.angular/.cache/coverage. Log `.browser/maintenance-eslint/parent-integration.log`; evidencia propia de workers en `cleanup-*` y `lint-*` del mismo directorio.
- No se leyeron ni modificaron dotenv ni plantillas. No se arrancaron servicios Docker ni bases, no se ejecutaron auditorías, navegador, suites completas ni commits. npm informó scripts de instalación bloqueados para cuatro paquetes; todas las comprobaciones requeridas ejecutadas aprobaron, sin habilitar esos scripts para ocultar avisos.
- ASSESS con item 5 (herramientas/dependencias y retiro del wrapper): **unassessable** por selección requerida de archivos sin seguimiento, sin revisión ni aprobación nativa. No se repitieron intentos de los verificadores históricos bloqueados.
- El humano autorizó crear, usar y retirar únicamente `/tmp/universidad-eslint-verify-01a1be31`, sin dotenv ni datos reales. El padre creó esa raíz de forma exclusiva. Verificador nuevo `mw8slu6k-e-dwta`: **pedidos 1–6 conformes**, sin bloqueadores; en copia aislada `verifier.Vb6tLg`, lint **PASS**, **13/13 pruebas PASS** en 16.432 s, sondas independientes TS/HTML/inline válidas e inválidas e ignores **PASS**, manifest/lock/instalados coherentes y dependencias productivas intactas. `git diff --check` aprobado, checkout idéntico antes/después; sin instalación, auditoría, build, contenedores ni suite completa nuevos.
- Incidente de sonda independiente: su primera muestra HTML era válida por error (`[(thing)]`); falló la expectativa de la sonda, no el producto. Corregida a la sintaxis inválida `([thing])`, produjo la regla esperada externa e inline. No se añadió el comprobador permanente sugerido: las sondas ya acreditan el comportamiento y no se agregan artefactos opcionales al pedido de limpieza.
- Terminada la verificación, el padre retiró exclusivamente `verifier.Vb6tLg` y luego la raíz autorizada vacía. Otros temporales históricos fuera del proyecto no se leyeron ni limpiaron. La evidencia histórica anterior permanece como tal; la aprobación funcional independiente corresponde a este candidato actual.

## Corrección CLI Docker — hostname interpretado como proyecto

- Reproducción real con **Angular CLI/build 21.2.27**, **Node 24.22.1** y **Vite 7.3.6**: `ng serve --allowed-hosts localhost` termina con **exit 1**, stdout vacío y stderr exacto `Error: Invalid values:\n  Argument: project, Given: "localhost", Choices: "frontend"\n`. La CLI expone la unión array/boolean del builder únicamente como booleano. `--help` termina con 0 incluso con los argumentos rotos: no acredita parsing correcto. Logs iniciales en `.browser/compose-environments/cli-parser/`.
- Tampoco basta `--allowed-hosts=hostname`: el experimento con CLI/builder reales inicia, pero `Host: museum.example.test` recibe **403**, no 200. Evidencia `.browser/compose-environments/cli-equals-experiment.log`. Un primer sondeo sin fuentes con `=localhost` agotó su límite de 30 s y fue terminado; no se interpreta como éxito ni se reintenta para ocultarlo. El experimento posterior usa una fixture mínima ejecutable y comprueba HTTP.
- Corrección limitada a `compose.dev.yml`: retirar ambos tokens y configurar **`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: ${TRAEFIK_HOST:-localhost}`** en el servicio frontend. Vite incorpora ese único hostname a su lista; **la validación permanece restrictiva**, sin `true` ni disable-host-check. Conserva los hosts locales/IP nativos de Vite, no constituye una allowlist exclusiva de localhost. Frontend no recibe dotenv ni credenciales. Sin cambios en Angular, Dockerfile, dependencias, puerto 4200, polling o proxy `backend:8080`; modo host conserva su configuración original.
- RED: `python3 -B scripts/test_start.py ComposeTests.test_development_actual_cli_and_restrictive_hosts` (salida redirigida a `.browser/compose-environments/cli-red.log`), **exit 1**, dos fallos esperados: default y hostname personalizado consumidos como proyecto. El subcaso host ya pasa.
- GREEN: mismo test focalizado, **exit 0**; `.browser/compose-environments/cli-green-focused.log`. CLI público real (`node .../@angular/cli/bin/ng.js serve`, sin mocks del parser) en tres fixtures mínimas temporales excluidas bajo `.browser/compose-environments/cli-runtime-*`, con node_modules enlazado, caché Angular deshabilitada, puerto aleatorio y polling de URL observable, no espera fija. Se terminan únicamente los procesos creados y se retiran las fixtures al finalizar. Default localhost, override `museum.example.test` y modo host: host permitido y localhost **HTTP 200** con contenido marcador, host ajeno **HTTP 403** con mensaje de rechazo. Stdout, stderr, argumentos, salida de terminación y respuestas HTTP: `.browser/compose-environments/cli-{default,custom,host}-{stdout,stderr,result}.log`.
- `git diff --check`: **exit 0**, sin salida.
- Contraste del padre: `python3 -B scripts/test_start.py` **19/19 PASS**, exit 0 en 16.578 s; incluye CLI/builder reales, default/custom/modo host y rechazo HTTP de hostname ajeno. `git diff --check` **PASS**. Log `.browser/compose-environments/cli-parent.log`. Sin stack Docker vivo ni dotenv reales.
- ASSESS del candidato corregido: escalación item 2 por configuración del guard de hosts; **unassessable** por declaración requerida de archivos sin seguimiento, sin revisión ni aprobación nativa.
- Verificación independiente `mw8rkyqi-9-o8nv`: corrección conforme estáticamente, sin defecto identificado. Contrastó en Vite 7.3.6 que la variable añade un hostname al array y que el guard mantiene el rechazo 403; `git diff --check` PASS. **No ejecutó la regresión** por conflicto entre aislamiento en copia temporal propia exigido por su runtime y la restricción de no crear scratch adicional. No se relanzó ni sustituyó. La ejecución independiente sigue pendiente/no aprobada y requiere aceptación humana para cerrar con ese límite.
- `python3 -B scripts/test_start.py`: **exit 0, 19/19 PASS**, preservando los 18 contratos Compose/arranque previos y añadiendo la regresión de CLI real. No se ejecutaron servicios Docker, bases, imágenes, suites completas, auditorías ni commits. No se leyó, modificó ni copió ningún dotenv del checkout; las pruebas existentes usan exclusivamente fixtures ficticias. La comprobación no acredita la aplicación completa ni un stack Traefik vivo. Los cambios previos se preservan.

## Seguimiento Compose — host predeterminado `localhost`

- `TRAEFIK_HOST` usa `localhost` por defecto tanto en el router Traefik como en `--allowed-hosts` de Angular; overrides explícitos conservados. README actualizado. Dotenv y plantillas intactos: cualquier valor explícito existente prevalece sobre el nuevo default.
- RED: `python3 -B scripts/test_start.py`, **exit 1, 18 pruebas, 3 fallos** por esperar el host `localhost` frente al default anterior. Log: `.browser/compose-environments/localhost-red.log`.
- GREEN: mismo comando, **exit 0, 18/18 PASS**; incluye defaults y override ficticio `custom.localhost` en ambos modos, y allowed-hosts de desarrollo. Log: `.browser/compose-environments/localhost-green.log`.
- `git diff --check`: **exit 0**, sin salida.
- Solo modelos Compose en fixtures temporales intrínsecos de la suite, con valores ficticios; sin leer dotenv/plantillas del checkout, builds, servicios, contenedores, auditorías ni commits. Cambios previos preservados. No acredita runtime ni revisión independiente.

## Seguimiento Compose — alias interno `proxy`

- Renombre acotado aceptado por el usuario («Si, dale»): clave interna `edge` → `proxy` en el overlay y sus referencias activas en pruebas, README e instrucciones. El nombre externo `${TRAEFIK_NETWORK:-proxy}` y su override permanecen idénticos; sin cambios de conexiones, puertos, volúmenes ni datos. La evidencia histórica siguiente conserva su nomenclatura original.
- RED: `python3 -B scripts/test_start.py`, **exit 1, 17 pruebas, 2 errores `KeyError: 'proxy'`** antes de cambiar el overlay. Log: `.browser/compose-environments/alias-red.log`.
- GREEN: `python3 -B scripts/test_start.py`, **exit 0, 17/17 PASS**, incluidos ambos modos Traefik y override ficticio `custom_proxy`. Log: `.browser/compose-environments/alias-green.log`. Se mantienen las comprobaciones anteriores de arranque, aislamiento, puertos, almacenamiento y licencias.
- `git diff --check`: **exit 0**, sin salida. Solo modelos Compose en copias temporales de los tres manifiestos con dotenv ficticios generados por la suite; ningún dotenv ni plantilla del checkout leído o modificado. Sin builds, servicios vivos, navegador, suites adicionales ni commit; cambios previos preservados. Esta comprobación del writer no acredita runtime ni revisión independiente o nativa.

## Seguimiento Compose — simplificación de nombres y defaults

- Pedido 1–4 cubierto: Traefik local publica literalmente `127.0.0.1:80:80` (opción humana «Puerto fijo local 80 (recomendado)»); router/servicio fijos `museum` en ambos modos, sin interpolación del nombre de proyecto. Son modos alternativos para el mismo router/servicio/host, no publicación simultánea en un proxy sin rutas manuales distintas.
- Redundancias retiradas: `build.target: production` en ambos builds de producción (sus últimas etapas ya son `production`), `name` explícito del volumen (Compose resuelve el mismo `universidad_museum_mvp_data` bajo proyecto `universidad` y clave `museum_mvp_data`) y etiqueta de deshabilitación del proxy local (`exposedbydefault=false` ya lo excluye). Sin renombrar recursos ni migrar datos. Se conservan los valores internos explícitos, credenciales alineadas, `env_file`, salud, dependencias, montajes selectivos, licencias y aislamiento app/edge.
- RED observado: `python3 -B scripts/test_start.py`, **exit 1, 17 pruebas, 3 fallos y 1 error** por puerto configurable, nombres dinámicos, defaults redundantes y etiqueta `museum` ausente. Log `.browser/compose-environments/simplify-red.log`.
- GREEN observado: `python3 -B scripts/test_start.py`, **exit 0, 17/17 PASS**. Log `.browser/compose-environments/simplify-green.log`. Regresiones nuevas comprueban puerto fijo pese a ajuste ficticio obsoleto, nombres estáticos coherentes, ausencia de defaults redundantes y nombre durable efectivo sin cambios; las anteriores conservan arranque/rechazos, puertos, entorno, redes, salud, montajes y licencias.
- `bash -n start.sh` y `git diff --check`: **exit 0**, sin salida. No se ejecutaron builds, contenedores, suites generales, auditoría ni navegador. Los modelos Compose se resolvieron solo en fixtures temporales con dotenv ficticios generados por la suite; ningún dotenv ni plantilla del checkout leído o modificado. Cambios previos preservados; sin commit ni revisión nativa del writer.
- Contraste del padre: `python3 -B scripts/test_start.py` **17/17 PASS**, `bash -n start.sh` y `git diff --check` **PASS**; `.browser/compose-environments/simplify-parent.log`.
- Evaluación nativa ASSESS con item 5: **unassessable** por declaración requerida de archivos sin seguimiento; sin revisión ni aprobación nativa.
- Verificador independiente `mw8qdlgv-5-0jwk`: reglas **1–4 conformes estáticamente**, sin defecto identificado. No pudo ejecutar sus comprobaciones: informó conflicto entre la obligación de scratch temporal externo de su runtime y la restricción de permanecer en el proyecto. No creó scratch ni accedió a dotenv; no se relanzó ni se cambió de verificador. **Verificación ejecutable independiente pendiente/no aprobada**; requiere decisión humana para aceptar el cierre con este límite. Las pruebas aprobadas del padre y writer no se atribuyen al verificador.
- Riesgo item 5: nombres, puertos y defaults resueltos comprobados estructuralmente; no nueva acreditación runtime. Un puerto local 80 ocupado impide iniciar el proxy incluido: no se modifica para eludirlo ni se detienen servicios existentes. La evidencia de builds y verificaciones previas siguiente es histórica, no nueva.

## Histórico: seguimiento Compose — desarrollo autónomo, dotenv y redes

- Reglas 1–5 implementadas: `compose.dev.yml` autónomo con PostgreSQL/volumen propios bajo `universidad-dev`; backend con `env_file` `.env`/`.env.dev` según modo; red externa Traefik `proxy` por defecto con override conservado; red `app` por proyecto para los tres servicios, base/backend nunca en `edge`; banners BASE/DEVELOPMENT/BUILD/PRODUCTION en ambos Dockerfiles.
- `env_file` entrega variables al backend, no interpola `${...}`: desarrollo requiere `--env-file .env.dev`. `environment` conserva `museum-db:5432` y puerto backend 8080; frontend sin dotenv ni credenciales. `app` conserva salida externa para TDWG. Producción mantiene el volumen durable `universidad_museum_mvp_data`; Java sigue requiriendo reinicio manual y Angular conserva hot reload configurado.
- RED observado: `python3 -B scripts/test_start.py`, exit 1, **14 pruebas, 5 fallos y 1 error** por ausencia del marcador de entorno, desarrollo incompleto, default anterior de red y banners ausentes. Evidencia: `.browser/compose-environments/followup-red.log`.
- GREEN observado: mismo comando, exit 0, **14/14 PASS**. Modelos Compose evaluados únicamente desde fixtures temporales con dotenv ficticios; cubren ambos modos, credenciales ausentes/vacías, puertos internos fijos frente a overrides host, dependencias saludables, aislamiento de redes/volúmenes, override Traefik y licencias. Evidencia: `.browser/compose-environments/followup-green.log`.
- `bash -n start.sh` y `git diff --check`: **PASS, exit 0**; resultados registrados en `followup-green.log`.
- Contraste del padre: `python3 -B scripts/test_start.py` **14/14 PASS**, `bash -n start.sh` y `git diff --check` **PASS**. Log `.browser/compose-environments/followup-parent.log`.
- Verificación independiente del nuevo candidato `mw8pt0l0-3-bsm4`: reglas **1–5 cumplidas**, sin bloqueadores; **14/14 PASS**, sintaxis/diff PASS y **8 probes propios PASS** (ambos modos × Traefik existente/local × nombre default/override, con proyecto explícito). No se incorporó la prueba adicional sugerida: los probes ya aportan evidencia y no se amplía el alcance solicitado.
- ASSESS del nuevo candidato con escalación explícita item 5: **unassessable** por declaración pendiente de archivos sin seguimiento; no hubo revisión ni aprobación nativa. La verificación independiente sí se ejecutó para este candidato distinto del histórico rechazado.
- Sin acceso a ningún dotenv ni plantilla del checkout; cambios previos preservados. No se arrancaron servicios, construyeron imágenes ni ejecutaron suites frontend/backend, navegador o auditoría. Los builds y smoke anteriores son evidencia histórica, no comprobaciones nuevas de este seguimiento. Sin commit.
- Incidente de límites del verificador: informó una copia selectiva sin dotenv/Git conservada en `/tmp/museum-independent-rzBELKm9`, fuera del proyecto pese a la instrucción de permanecer dentro. El padre no la leyó ni retiró: cualquier acceso/limpieza requiere autorización específica. No constituye prueba runtime ni reemplaza el contraste local del padre.

## Histórico: Compose de producción, desarrollo y Traefik — comprobaciones acotadas

- Implementados `compose.yml` principal, override `compose.dev.yml` y overlay `compose.traefik.yml` con perfil `local-traefik`. Producción conserva el volumen MVP; desarrollo usa almacenamiento propio. El proxy Angular host se conserva y Docker usa `proxy.docker.conf.json`.
- Dockerfiles multietapa compilan desde fuentes, preservan las licencias Angular y excluyen dotenv de los contextos. Se retiró `backend/docker-healthcheck.sh`; Compose exige HTTP 200 del estado público del catálogo mediante curl. `application.yaml` ya tenía `SERVER_PORT:8080`, credenciales obligatorias y ninguna carga dotenv; se conserva.
- No se leyeron dotenv reales. El harness bloqueó `.env.example`; el humano autorizó continuar dejando todas las plantillas intactas. Los cambios previos sin commit, incluida esa plantilla, no fueron revertidos ni publicados.
- RED: `python3 -B scripts/test_start.py`, 12 pruebas / 9 fallos esperados antes de implementar los nuevos contratos. GREEN y contraste final: **12/12 PASS**; cubren arranque literal/rechazo sin efectos, defaults y overrides, desarrollo aislado, etiquetas/redes Traefik de ambos modos, etapas Docker y licencias. Modelos Compose evaluados solo con valores ficticios. Evidencia: `.browser/compose-environments/{red,green,final-tests}.log`.
- `bash -n start.sh` y `git diff --check`: **PASS**. No se ejecutaron suites funcionales completas, navegador ni auditoría npm, por alcance acotado solicitado.
- `bash .browser/compose-environments/check-images.sh`: **PASS (exit 0)**. Compiladas las cuatro imágenes: producción y desarrollo de frontend/backend. Proyecto aislado `museum-compose-check-23666`, PostgreSQL en tmpfs y puerto frontend aleatorio en localhost; los tres servicios saludables. `/`, `/api/catalog/status`, `/api/validation-configuration` y `/3rdpartylicenses.txt`: **HTTP 200**. Contenedores y red propios retirados al finalizar; no se tocaron servicios ni volúmenes existentes. Log: `.browser/compose-environments/images.log`. No se ejecutó `start.sh` contra dotenv o datos vivos.
- Advertencias de build conservadas, sin ocultarlas: bundle Angular **649.97 kB / 500.00 kB** (exceso **149.97 kB**), dos repositorios de metadatos Maven devuelven HTTP 401 (build completado igualmente) y aviso de API Unsafe de Lombok en Java 27. No se cambiaron presupuestos ni credenciales para evitarlos.
- Evaluación nativa `assess` con riesgo de entorno (item 5): **unassessable**, por selección explícita requerida de archivos sin seguimiento; no hubo revisión ni aprobación nativa. No se intentó reconstruir autoridad ni leer plantillas bloqueadas.
- Verificador independiente solicitado por riesgo de entorno: **unavailable**; el harness rechazó la admisión por no reconocer la declaración de riesgo en el encargo. No se relanzó ni se sustituyó por otra vía. Las pruebas del padre no reemplazan esa verificación.
- Límites: recarga Angular configurada, aún no acreditada en navegador; Java requiere reinicio manual. Traefik local usa socket Docker `:ro` (no restringe métodos del daemon), red externa creada por el operador y puertos locales; sin dashboard/TLS ni habilitación para Internet.

## Actualización del backend a Java 27

- Maven compila con `release 27`; Spring Boot **4.1.2**, Lombok **1.18.48** y contenedor `eclipse-temurin:27-jre-resolute` (Ubuntu Resolute). Se conservan el usuario no privilegiado y el JAR copiado dentro de la imagen.
- Primer intento `bash ./mvnw package -Dmaven.test.skip=true`: **FAIL**, inicialización de Lombok (`com.sun.tools.javac.tree.EndPosTable`) con las dependencias anteriores. Se corrigió Lombok y se actualizó Spring Boot al parche compatible con Java 27.
- En copia aislada bajo `.browser/java27/build/backend/`, `bash ./mvnw package -Dmaven.test.skip=true`: **PASS**; `docker build -t universidad-java27-check:local .`: **PASS**. No se añadieron ni ejecutaron tests; solo se alineó la expectativa existente de la ayuda de `start.sh`.
- Arranque real de la imagen con PostgreSQL 17 Alpine desechable en tmpfs, red propia, puerto HTTP aleatorio en localhost y sincronización programada deshabilitada: **PASS**. `GET /api/catalog/status` y `GET /api/validation-configuration`: **HTTP 200**; `bash /app/docker-healthcheck.sh`: **exit 0**. Runtime **Temurin 27+35** y usuario **museum, uid 999** comprobados dentro del contenedor.
- Contenedores y red propios eliminados al finalizar; sin acceder a dotenv, volúmenes ni servicios existentes. Logs y respuestas locales: `.browser/java27/`.
- La evaluación nativa `assess` quedó **unassessable** por exigir declaración explícita de archivos sin seguimiento; no hubo aprobación nativa ni se accedió a `.env.example`. La verificación independiente requerida por el cambio de entorno sí se ejecutó.
- Verificación independiente estructural: sin bloqueadores; `git diff --check` y `bash -n start.sh` aprobados. El padre contrastó sintaxis de ambos scripts y `bash start.sh --help`. No se ejecutaron suites backend/frontend, navegador ni auditorías; esta evidencia acredita compilación y arranque, no compatibilidad exhaustiva de todos los endpoints.

## Vigente: reglas fijas y revisión compacta — CLOSED, T1–T5 done

Especificación: [normalization-simplification.md](odd/tasks/normalization-simplification.md), S1–S5 y L10–L11; contrato actual: [simplification-contract.md](design/normalization-live-preview/simplification-contract.md). **Las cinco Specs están aceptadas con evidencia acotada combinada**, no con certificación exhaustiva. Esta actualización documental registra observaciones suministradas y contrastadas por el padre; no ejecuta pruebas ni navegador nuevos. La sección de normalización interactiva siguiente es histórica, no prescribe switches opt-in para la UI vigente.

### Candidato y comprobaciones automatizadas

Cadena local C1 `fc4f4224b88ebe6ec8e09ff2a695bbcc599bef43` → C2 `143d55985a8677942206c7c5c0da007198447b64` → C3 `b787754d6452bbf921fcc1cdd3d03becd7904431` → C4 `021f9e29404e243c268e84724648423349a26866` → C5 `cc3602353b6873ff42dffdd798a26507ca6cec6d` en `feat/normalization-changes-review`. C5:6archivos/+140/-21=161líneas; C1–C5: **1151 líneas autorales observadas**, antes del último seguimiento documental del padre, aún sin SHA y no nueva unidad de comportamiento. Cortes321/140/178/351/161, todos≤400; no tamaño de la rama completa desde origin/main. Estrategia cacheada `auto-chain` / `stacked-to-main`, destino main registrado LOCAL `17ce991dc8c57ca59a5c6a95ec74c6a539872c0e`. Base `505d60d` y sus veinte commits de funcionalidades previas cerradas quedan fuera de revisión nueva. Su integración o disposición explícita sigue siendo prerrequisito de publicación futura, no autorización de merge ni bloqueo documental. Sin push/PR/merge; no se inventa SHA del último seguimiento.

- GREEN públicos por corte: C2 **107/4 archivos**, C3 **59/3**, C4 **71/3**. No sumarlos como un total nuevo. Los RED, intentos técnicos y correcciones de harness están conservados en L6–L8 y `.browser/normalization-simplification/{engine,fixed-rules,compact-review}/`.
- Independiente integrado `mw578dwh`: **178/7 existentes PASS**, **5 OWN PASS**, puente **worker_threads real PASS**; fuente C4 sin cambios. Evidencia auténtica `.browser/normalization-simplification/independent/result.md`, incluidos seis JSON OWN1–OWN6. Primero hubo 4 OWN PASS/1 FAIL por expectativa de columna [0] frente a ventana de50, y puente exit1 por colisión esbuild sourcefile/salida: corregidos solo los harness antes de PASS, no defectos del producto. Scratch externo no recuperado ni eliminado.
- Seam completo del padre: **225 pruebas/15 archivos PASS**, checker y build exit0, `3rdpartylicenses.txt` presente. `.browser/normalization-simplification/seam/{results.json,suite.stdout,build.stdout,build.stderr}`. Bundle **649.97 kB / 500.00 kB**, exceso **149.97 kB**, presupuesto intacto. Sin nuevas pruebas backend ni auditoría npm; la auditoría pendiente aceptada no se repitió.

### Navegador real: núcleo y cinco comprobaciones complementarias

QA `mw588jkj` comprobó el núcleo S1–S5 con controles públicos, sin sourcefix: fixture **120 filas/70 columnas**, cambios iniciales4 en físicos **2/22/50/112**; coma explícita6 añade **152/182** y DMY7 añade **222**. Todos conserva120, páginas10/25/50/100 y última20 hasta físico240; IDs `0001`, `1`, `ABC`, `abc` intactos. Seis reglas fijas, único switch de ocultación; formatos/duplicados plegados al entrar. Columna60 oculta no retira fila112 cambiada; columna69 con único dato en fila236 sin cambios permanece visible al calcular vacías sobre TODOS.

Fixture12 sin cambios: Con cambios **0–0 de 0**, ambos avisos globales1grupo/2afectadas por criterio; CTA lleva foco a Todos y permite llegar al físico24. Fixture500: ocultar conserva fila física2 con cero celdas; restaurar devuelve ventana50. Valores planos sin glifos en cada espacio; visualizador solo en detalle del original.

Geometría observada: primera fila a1440×900 top786.22/bottom858.47; a1920 top772.22. Móvil390 sin overflow documental, hoja con scroll interno1838/340, cabecera/fila física sticky. Controles44px, zona hide44×24 y thumb16, desplazamiento checked20; reduced-motion0s. Escape externo/interno, flechas y Tab comprobados. El reporte inicial quedó **PARTIAL por cinco comprobaciones auxiliares NO ejecutadas**, no por defectos de producto ni indisponibilidad. Espera25s con condición errónea «Resumen» tras Aplicar se conserva como incidente de automatización: Aplicar permanece en Normalizar, no timeout ambiental/EAGAIN. Otros incidentes de selectores pertenecen al harness.

Continuación dirigida `mw58prll`: SOLO las cinco pendientes A–E, reporte `qa/remaining/report.json` **completed/PASS**:

1. Filtro de incidencias realmente visible en0; JSON/CSV conservan las **42 incidencias completas**, los seis campos coinciden en cada fila, contexto system/revisión0; dos avisos full y dos ID en físicos12/202.
2. Clic real Cerrar restaura foco a celda2:9, panel cerrado sin reapertura inmediata.
3. Thumb normal asentado20 con transición.12s; movimiento reducido contrastado en el recorrido principal.
4. Ambos botones DOM de navegación de500columnas en viewport:169.44×44 y170.03×44.
5. Ayuda **Sin occurrenceID** efectivamente visible.

HAR principal **31 GET** y suplementario **21 GET** son sesiones separadas, no una sesión sumada; suplemento además hizo dos GET directos posteriores de metadatos. Configuración/catálogo byteidénticos antes/después y hashes de fuentes intactos; sin POST/PUT, solicitudes biológicas ni errores de consola, ambas sesiones cerradas. HAR describe tráfico emitido; no convierte estados worker0 en éxito HTTP.

Procedencia cruda bajo `.browser/normalization-simplification/e2e/`: fixtures/manifest, `qa/` (informe y HAR principal), `qa/remaining/` (informe, descargas JSON/CSV y HAR suplementario), `qa/parent-contrast.json`. El padre leyó ambos reportes, análisis/F1 y cinco resultados, contrastó los42registros CSV/JSON en todos sus campos y ambos HAR por separado, y abrió dos PNG representativos:1440por defecto y móvil con formatos. Confirmó físicos4/6/7, Todos120/última240 y ausencia de cuerpos POST. No es una repetición propia de cada acción del navegador.

### Límites y cierre observado

S1–S5 aceptadas en este alcance; no certificación ISO, accesibilidad exhaustiva, benchmark25millones ni nueva comprobación de cada CLI. ASSESS high/agentEscalation4, nativa no evaluable por untracked/candidate null, sin aprobación nativa, reviewDue ni START ofrecidos; independiente nuevo completado, no equivalente a aprobación nativa. Notas históricas de auditoría, cachés privados y captura accidental externa se conservan intactas abajo; ningún bypass de `.env.example`.

**T1–T5 done**, aceptación S1–S5 y C5 acreditadas. Padre observó comprobación documental **PASS de SOLO5enlaces Markdown locales AÑADIDOS**, handoff01 IMPLEMENTED y diff0; no comprobación de todos los enlaces. Frontend sin cambios desde candidato225/15, fuente C4 `021f9e29404e243c268e84724648423349a26866`; backend intacto/no reejecutado. Evidencia `.browser/normalization-simplification/final/documentation.json`.

Salud final del padre: SOLO preview propiojob5 detenido,4201CLOSED; APIjob1/8080 y DEVjob2/4200 GETconfiguración/catálogoHTTP200, DB55432OPEN. Ambas sesiones QA propias ya cerradas; ningún otro recurso detenido. Permanecen los dos jobs de desarrollo y DB indicados. Evidencia `.browser/normalization-simplification/final/health.json`. Handoff01 IMPLEMENTED con preview4200; alternativas02/03 históricas intactas. No limpieza de scratch/cachés externos acreditada ni prometida.

C5 existe; solo resta al padre registrar este último seguimiento documental, sin SHA inventado y sin requisito funcional pendiente. Publicación futura requiere decisión humana y disposición previa de base505; no push/PR/merge autorizados. Las frases de T5pendiente/en curso, previewactivo y comprobaciones no ejecutadas en registros anteriores son **HISTÓRICAS**, no el estado vigente: las cinco A–E ya son PASS. Esta actualización pasiva no ejecutó checks, código, servicios ni Git.

## Histórico: normalización interactiva — CLOSED, T1–T5 completadas

**Resultado vigente (L14):** feature aceptada y cierre T5 observado por padre: corrección fuente `9d368fe` y aceptación documental `4d0cfe1` (6archivos/+151/-13). Comprobación estructuralexit0 de SOLO los2enlaces Markdown relativos añadidos y handoffIMPLEMENTED; gitdiffcheckexit0. No revisión de todos los enlaces del repositorio. Evidencia `.browser/normalization-live-preview/runtime-resume/documentation-check.json`.

Salud final: GETconfiguración/catálogoHTTP200 en API8080/DEV4200, DB55432OPEN; parentjobs2/3 vivos. SOLO preview propiojob4/4201 detenido y puertoCLOSED, ningún otro recurso detenido (`.browser/normalization-live-preview/runtime-resume/final-health.json`). Sin push/PR/merge. Último commit de seguimiento aún a cargo del padre, sin SHA inventado. Las frases de bloqueo/T5in_progress/preview activo siguientes son HISTÓRICAS, no el estado actual. No se ejecutaron comprobaciones funcionales nuevas para este cierre; fuente intacta ya respaldada por203/15archivos y buildPASS, no suma de históricos.

### Aceptación dirigida tras restaurar runtime

- QA `mvwxurvd`, continuación del rol `mvu4o1xq`: F1 focoAplicar→hover real fila2→Escape cierra sin reapertura inmediata y conserva foco externo; Escape interno/Cerrar restauran celda2:9. F2 media reduce real:7pseudo-elementos0s/none frente a7×.12s normal; checked/translate20 operable. F3 los8botones renderizados (paginación, Cerrar original, Ver diagnóstico, Aplicar PrimeNG, Finalizar)44px en escritorio1920/móvil390, sin overflow documental; footer envuelve, originalx14..376/y533.83..830.
- Con34columnas NO se renderizaron botones de ventana de columnas: no nueva geometríaPASS de esos botones ni recarga de500columnas. CSS scoped/regresión compilada cubren selector; aceptación500previa conservada. Guarda Escape inactiva/otrosfooters no repetidos en browser: regresiones públicas57 y contraste de fuente. No repetir ni sumar aceptación previa52filas/última104/páginas10/25/50/100,500/hide/allhidden,416celdas/52registros,modos/precisión,ambosduplicados,8warningsJSONCSV/filtro0/retenciónSPA.
- HAR iniciado ANTES de navegar:17GET/0POSTPUT/sin cuerpos; metadatos configuración/catálogoGET200 antes/después byteidénticos. Tres entradas workerstatus0 NO cuentan como HTTPsuccess. Consola/errores0; sesión propia cerrada. QA abrió4capturas nuevas; padre abrió2 y leyó F1json/bboxesF3/HAR/bytesAPI, dejando `.browser/normalization-live-preview/e2e/qa/recheck/parent-contrast.json`.
- Evidencia automatizada de este corte:57focales(34workbench,16layout,7evolution),203suitecompleta/15archivos, build/arquitectura/diff0,3rdpartylicenses preservada. Bundle649.22kB frente a500kB, sin cambiar política. No sumar199históricas+203+57; motor/concurrencia intactos e independientes previos no repetidos. Evidencia: `.browser/normalization-live-preview/{ui/t4-correction,seam-corrected,e2e/qa/recheck,runtime-resume}`.

**Límites vigentes:** no certificación exhaustiva ISO/a11y/roving/matriz de opciones/originales gigantes; glifos de espacios box-like previos no corregidos, sin diagnóstico de fuente. ASSESSmedium/nativeunassessable por untracked/candidate null, sin aprobación nativa; auditoría npm pendiente aceptada. Se conservan los incidentes y fallos históricos, no se presentan como fallos pendientes F1/F2/F3.

**HISTÓRICO — estado L13 anterior al cierre L14:** Handoff01-hoja-ancha ya IMPLEMENTED por padre con preview4200. Cinco cortes locales cohesivos: diseño e3a80b8, motor3aaa6c7/1174633, UI7a2b2b6 y corrección9d368fe; UI912adiciones+83correctivas sin comprimir/borrar pruebas para400. Base feature29eff98;18commits/11765líneas frente a origin/main incluyen funcionalidades anteriores cerradas, no el candidato actual. T5 sigue in_progress: faltan comprobación estructural documental, parada SOLO preview propio4201job4 y commit documental del padre; API8080job2/DB55432 y DEV4200job3 activos. Ninguna parada/commit documental aún acreditados, sin PR/push/merge. Esta actualización solo documenta evidencia del padre; no ejecuta pruebas ni servicios.

### Historial — recuperación T4, pendiente entonces de runtime humano

Registro: [normalization-live-preview.md](odd/tasks/normalization-live-preview.md), L10–L11, S1/S3 parcialmente satisfechos. Pedido literal: «retoma, se quedo pausado el proceso.» Esta entrada registra evidencia suministrada por el padre y artefactos existentes; no ejecuta pruebas, verificaciones ni runtime nuevos.

- Writer `mvu5b07e` terminó «assistant reported an error» después de20llamadas, dejando6archivos/+83/-5. Recuperación `mvwx55m0`: preservó RED válido53PASS/4FAIL/exit1 y ejecutó SOLO GREEN faltante57/57/exit0 (34workbench,16layout,7evolution), arquitectura/diff0. Sin retirar53pruebas/aserciones ni cambiar motor/estados/protocolo/opciones. Evidencia: `.browser/normalization-live-preview/ui/t4-correction/report.md` y logs.
- Padre leyó las tres correcciones: Escape de documento con guardas active/visible, foco externo preservado e interno restaurado; reduced-motion del ::before scoped; botones44px de hoja/footer SOLO case4. **F1/F2/F3 corregidos en código, NO nuevo PASS de navegador.** Positivos previos de52filas/duplicados/exportaciones no repetidos.
- Nuevo seam corregido del padre job1/exit0: **203 pruebas/15archivosPASS**, build0 y3rdpartylicenses conservada; `.browser/normalization-live-preview/seam-corrected/results.json` y logs. Aviso649.22kB/500kB, política intacta. Los199del candidato anterior no son el nuevo total ni evidencia nueva. ASSESSmedium/nativeunassessable por declaración untracked/candidate null; sin aprobación ni nueva independiente necesaria para concurrencia intacta. Sin nativeinspect/start/reclaim ni acceso env.
- Padre observó4200/8080/55432/4201cerrados y ningún job de fondo. Worker readonly `mvwxalpz` confirmó SOLO contenedor propio `universidad-normalization-dev-db`, postgres17-alpine/local55432/volumen anónimo NO `postgres_data`/Exited255 y JAR COPIADO SHA256 `9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084` coincidente. No pudo derivar de evidencia pública usuario/contraseña ficticios anteriores ni flags exactos. Sin adivinar, leer env/dotenv/cachés privados, arrancar/resetear/nuevaDB/SQL/migraciones; runtime, GET públicos y recheckF1/F2/F3 NO realizados.

**T4 BLOCKED, decisión humana única:** restaurar manualmente DB propia55432+API8080 con configuración anterior conocida, O proporcionar los parámetros FICTICIOS seguros conocidos. No compartir credenciales reales, leer env protegido ni sustituir la prueba final por mocks. T1/T2/T3done intactos; T5pending por prerrequisitoT4. Tras runtime disponible: preview propio4201/envDir vacío, navegador dirigido SOLO F1/F2/F3 y overflow móvil, luego handoff/docs/commit local del padre. Sin nuevas suites/sondas/revisiones generales; sin handoff implemented, commit/push ni feature cerrada.

### Historial — runtime de normalización restaurado (L12)

Pedido literal: «Levantalos con los paramentros anteriores.» Según evidencia del padre, DB sintética propia existente55432/postgres17-alpine y volumen anónimo conservados; API8080parentjob2 desde JAR copiado SHA256 `9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084`, DEV4200job3 y preview productivo propio4201job4/envDir VACÍO arrancaron correctamente. GET públicos job5: configuración/catálogoHTTP200 en8080/4200/4201; configuración5contextos byteidéntica a aceptación previa (`.browser/normalization-live-preview/runtime-resume/health.json`).

Reutilización humana explícita de parámetros anteriores: recuperación privada, solo en memoria, de3parámetros POSTGRES del MISMO contenedor sintético creado por el agente originalmente sin dotenv. Restricción NoDockerEnv del handoff revisada solo para ese alcance, no bypass de .env; sin entorno host, valores secretos impresos/persistidos, .env real/.env.example, Compose, nuevaDB ni reset. Mem168 registra configuración efectiva, sin duplicarla. Preflight de plantilla childlaunch.py falló una vez antes del arranque y fue corregido; readiness PostgreSQL permitió estados1/2 dentro de30s antes del arranque real. Resultado final correcto.

**T4 in_progress, ya no BLOCKED**; el bloqueo anterior queda como historia. Pendientes SOLO navegador F1/F2/F3 y overflow móvil; S1/S3 aún parciales, T5pending. No nuevo PASS de navegador, aprobación nativa, handoffdone, commit ni cierre. Esta actualización documental no ejecutó comprobaciones ni servicios.

## Estado actual: administrador de fuentes, estados persistentes y módulos alineados

Especificación: [record-sources-admin.md](odd/tasks/record-sources-admin.md). Nombre de pantalla y menú **Fuentes de registros biológicos**; el paso Contexto del análisis permanece intacto. Propietarios técnicos `features/record-sources` y `co.edu.unicauca.backend.recordsources`, sin cambiar `/api/validation-configuration`, clave Query, protocolo de revisión, esquema ni migraciones. El requisito S4 posterior extiende los metadatos con `optionalFields`, conservando las reglas anteriores y la compatibilidad legada.

- Backend `40941aefd0c9da48022b2ef242cb876654a706f3`: paquete/imports alineados, handler compartido solo cambia imports; checker comprueba correspondencia de namespace/directorio. RED estructural16tests/15fallos → GREEN16/16, codegen3, Java96/0fallos/errores/omitidas ypackageofflinePASS. Padre contrastó89/89fuentescheckout/copia y45/45recursosHEADintactos,5exit0 yXMLsummary. Persistencia/migraciones solo en PostgreSQL desechable. Riesgo:item3porcheckercompartido, verificador independiente satisfecho por diferenciales de contratos/checkers (L9 de la especificación); ASSESS no evaluable poruntracked, sin aprobación nativa.
- Diseño `6d115e6c272dfcbb60cd44be0f01dc73cdaea9a5`: sistema capturado desde fuentes reales (49tokens+9alias) y3alternativas autónomas; elegida `design/record-sources-admin/01-master-detail.html`, las otras son alternativas. Canvas inicial46615; tras el apagón se reabrió en127.0.0.1:44661. Handoff01 implementado con preview4200; autoabrir ventana falló porxdg-open ausente, no por producto. HTML/JS/manifest/paleta/semillas comprobados estructuralmente; el boceto no sustituye UX real. Sistema/consumidores conservan paleta, fuente y selector DwC existentes.
- Frontend: maestro–detalle, cinco fuentes/recuentos reales, búsqueda solo visual, campos largos envueltos, estados de revisión/pendiente/error y guardado global explícito. RED DOM de5fallos con compilación válida → GREEN13/13. Primera suite135PASS/1fallo por selector CSS estructural agrupado; se separaron selectores sin quitar aserciones y136/136PASS. Worker buildPASS; su último rótuloHTML tuvo13focalizadasfinales. Padre volvió a comprobar el candidato completo con ese rótulo: job5 checker+136/136+buildexit0, aviso645,13kB/500kB, presupuesto intacto.
- Padre leyó editor/EVIDENCE, abrió `desktop-final.png`, `mobile-sources.png` y `mobile-long-field-final.png`, confirmó7consumidores con cambios exclusivamente de importpath y modelos idénticos, GETconfiguración/catálogo antes/después/actual byteidénticos. Guardado usa borrador completo, nunca lista filtrada. No Guardar, PUT/POST, sincronización ni biología en pruebas de navegador.
- Browserwriter propio cerrado:1440px/390pxsin desbordamiento documental, lista748/748y298/298; valorlargo48px/112pxalto. Selección5fuentes30/22/10/15/8, búsqueda mayúsculas/vacío/limpiar, pickerEnter/Escape/foco, quitar/agregarborrador, guarda cancelada conserva entrada yrefreshGET200descarta solo tras lectura correcta. Fuente computada del sistema ypineRGB(25,76,58); SCSS sin nueva paleta/familia/sombras.
- Incidentes documentados en `.browser/record-sources-admin/frontend-check/evidence.md`: acción CLI inexistente, localizador ambiguo que pulsaba Limpiar, clic fuera de viewport seguido de espera25sagotada. No prueban defectos del producto ni éxito del agregado; se conservaron esas capturas fallidas. Sesión cerrada y recorrido corregido con botón CSS exacto/scroll explícito/GET final200, capturas finales abiertas; no se aumentaron tiempos ni se ocultó el incidente.

### S4: campos obligatorios/opcionales persistentes

El usuario confirmó conservar los opcionales visibles y guardados. `optionalFields` extiende cada contexto; alternar mantiene el campo, Quitar lo retira de ambas listas. Omitido al leer datos legados equivale a `[]`; omitido en PUT conserva los opcionales existentes bajo el mismo lock/revisión y una promoción explícita a requerido elimina el solapamiento. Lista explícita sustituye opcionales; `[]` los quita. Nulos, duplicados, solapamientos o límites excedidos se rechazan sin modificar estado/revisión; 500 campos combinados y200caracteres porcampo. Sin V5 ni reescritura deV1–V4, semillas, catálogo o dependencias.

- Backend `13771c9525fe17fb87e50f1449c20a3296f2061a`: primer RED no conductual por compilación AssertJ, corregido; RED válido102/7fallos→GREEN102/0fallos/errores/omitidas, codegen3/arquitectura16/checker/packagePASS. Padre leyó servicio/codec/summary y contrastó90/90inputs/45protegidos, códigos de salida y JARhash9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084. Compatibilidad/merge atómico cubiertos con PostgreSQL desechable; verificador independiente de items1/4 reportó PASS; contraste y límite de artefactos detallados abajo.
- Frontend: estados accesibles juntoaQuitar, fila/foco estables, recuentos total/obligatorios/opcionales, búsqueda sobre ambas listas y guardado completo. RED4fallos/60PASS→GREEN65/65focales, suite141/13archivos+checker/buildexit0; aviso645,32kB/500kB. Padre confirmó logs/códigos, sin presentar141como una nueva ejecución propia. Validador productivo no cambió; solo requiredFields exige presencia. Soloartboard01 actualizado. Un primer script decontraste delpadre esperaba `.exit` numérico; archivos reales decían `exit=0`. Parser corregido y artefactos contrastados sin repetir navegador/PUT.
- Browser administrativo previo:4PUT200 enE2E, opcional persiste tras recarga29requeridos/1opcional/30total, reversión30/0, quitar29/0 y restauraciónrev4; payload completo pesea búsqueda. Imágenes móviles deestado/campolargo abiertasporpadre: dosacciones44px/foco visible/390sin overflow. Esto no acreditaba el diagnóstico real: cargaCSV falló porEAGAIN/page_wedged, HARworkerstatus0noHTTPsuccess. Intento adicional explícitamente autorizado volvió a fallar; no se ocultaron ambas pruebas ni se atribuyó causa de producto sin evidencia.
- Captura externa accidental `/home/dark/.agent-browser/tmp/screenshots/screenshot-1793259940647.png`: el humano autorizó eliminar únicamente ese archivo. `unlink` confirmó eliminación sin abrirlo ni acceder a otros archivos externos. Incidente conservado; no borra la evidencia histórica de otras capturas externas.

### Recuperación tras corte eléctrico y flujo real acreditado

Usuario pidió «Volve a intentar, inicia otra vez los servicios.» Todos los puertos estaban caídos y DBdev detenida; se recuperó su contenedor existente y se recreó únicamente E2E efímera perdida. JAR separado/hash igual. Dev4200/8080 y E2E4201/8081 dieronHTTP200/5contextos/opcionales; hash/contador de todas las tablasDEV antes/después iguales. Sin Guardar ni datos biológicos en servidor, ni nuevas migraciones. E2E ahora sirve el buildAngular existente con Vitepreview sinHMR y envDirdeprueba vacío; no instalaciones, ni lectura intencional de dotenv. Node con compilación acotada; no se afirma que esto demuestre la causa deEAGAIN.

Worker `mvtv1kqk-1-tiv0` completó una vez el nuevo flujo público autorizado: diagnóstico real10→0→10, revisión0→1→2, opcional guardado/visible con búsqueda activa y30campos(29/1). Archivo12×30/contextocollection retenidos porSPA; resultado invalidado tras ambos guardados. Comparación de mapeo se limita a12controles predeterminados visibles, no30ni mapeo personalizado. JSON/CSV inicial/final10incidencias subfamily/filas2–11/columna27/contextocollection/rev0o2; exportación opcional vacía. HAR2PUT200 de metadatos completos/cincofuentes/ambaslistas y4GETAPI200,0POST/registros. WorkerGETstatus0no se cuenta comoHTTPsuccess; el resultado observable acredita ejecución del motor. Conjuntos finales restaurados, no orden original de subfamily. Sesión cerrada/consola sin errores.

Padre abrió las2capturas nuevas, contrastó HAR/JSON/CSV/GETrealrev2 y logs141/65/build0. El verificador offline de snapshots delworker tuvo un primer fallo por normalización incompleta de refs; corregida solo esa comparación, sin repetir navegador ni alterar producto. Artefactos nuevos: `.browser/record-sources-admin/e2e/power-recovery/browser/screenshots/{report.json,parent-contrast.json,trace.har,config-before.json,config-after.json,initial.*,optional.*,required.*}`; recuperación/hashes bajo `e2e/power-recovery/`. La revisión independiente anterior ya satisfizo item3 decheckers por diferenciales exactos; su navegador aislado no encontróChrome y permaneceUNAVAILABLE, no aprobaciónUX.

### Verificación independiente S4 y cierre

`mvtvowl3-2-0e17` (gentle-ai-verify) reportó **PASS S4/API, items1/4**,51comprobaciones/155HTTP:121×200,32×400,2×409; PUT15×200,32×400,2×409. Roundtrips, omisión legada conservadora, promoción exacta, texto/espacios/orden,200caracteres/500combinados/listasvacías y rechazo sin cambios comprobados. Carrera con barreraA200/B409, revisión15→16 y estado igual al ganador. Restauró configuración completa en17 respecto al baseline2, sin reiniciar contador. Catálogo/status reportados byte-idénticos. Lectura de semillas/JSON legado solo estructural en esta asignación; no nueva ejecución del parser sobre almacenamiento legado.

Incidente del comprobador: exigía `type: about:blank` sin que fuera contrato. Conservó el fallo original, restauró revisión10 y continuó únicamente casos pendientes; no se ocultó ni se atribuyó al producto. **Límite de trazabilidad:** el scratch declarado `/tmp/gpbddf46/gaAVucXR/tmp.FSAcdtIQaD/proof/report.json` devolvió ENOENT al padre. Un readback cancelado por interrupción y el posterior `mvtw11np-4-ppdb` confirmaron que no se recupera ese archivo. No se conoce si fue eliminado o pertenecía a otro entorno temporal; no se reconstruyeron reportes, respuestas, hashes o script de regresión. El PASS51/155 es la salida histórica de la herramienta, no un JSON crudo recuperado ni una nueva ejecución del padre.

Padre sí contrastó **GET200 real, revisión17 y contenido completo/arrays/orden de cinco contextos idénticos al baseline2**, incremento15 coherente con15PUT200; catálogo byte-idéntico a la captura antes del navegador y JAR SHA256 esperado. Evidencia durable en `.browser/record-sources-admin/independent-optional/{verifier-result.md,parent-contrast.json,parent-configuration-restored.json,parent-catalog-after.json,cleanup.json}`. No afirma contraste propio de cada una de155respuestas. Reanudar por «Continua ejcutando lo pendiente» recuperó únicamente evidencia y completó cierre, sin repetir sondas/suites.

Handoff del artboard01 marcado implementado;02/03 son alternativas. Canvas reabierto en44661 (xdg-open ausente: abrir manualmente la URL de la herramienta). APIE2Ejob5 y previewjob6 detenidos; identidad de DBefímera comprobada por nombre/auto-remove/tmpfs/127.0.0.1:55434, contenedor retirado y puertos8081/4201/55434 cerrados. Desarrollo4200/8080 permaneceHTTP200 yDB55432 preservada; navegador propio ya cerrado. `docker stop --time5` emitió advertencia de opción deprecada, pero terminó correctamente; no se repitió.

**Límites vigentes:** bundle645,32kB/500kB; auditoría npm pendiente aceptada, no repetida; revisión nativa no evaluable poruntracked, sin aprobación; raw independiente no recuperable; fallosEAGAIN previos conservados, causa no demostrada. No nueva auditoría exhaustiva de accesibilidad/seguridad. Commits locales backendS4 `13771c9` y frontendS4 `f9bf9c5`; documentación/handoff/cierre en corte aparte. Sin push/PR/merge ni acceso/stage a dotenv. La evidencia anterior se conserva abajo como baseline, no se suma a esta ejecución.

## Base previa: configuración global y retiro de perfiles verificados en desarrollo

Pedido y decisiones: [odd/tasks/global-validation.md](odd/tasks/global-validation.md). Un solo contexto; configuración global editable con requisitos iniciales 30/22/10/15/8; `disposition` opcional solo en colección. El usuario pidió retomar y relanzar ambos workers y autorizó una migración que elimine definitivamente tabla/trigger de perfiles, preservando catálogo, configuración nueva e historial Flyway. V1/V2 no se reescriben; V3 agrega configuración y V4 retira exclusivamente tabla/trigger/función legados. Actualización desde V1/V2 y reinicio ya aprobados en PostgreSQL desechable. **Aplicado mediante Flyway en la base de desarrollo propia: tres perfiles retirados, sin borrado manual ni acceso al MVP ajeno.**

Los writers anteriores terminaron «assistant reported an error», sin entrega verificable. Se conservaron sus parciales y se relanzaron backend `mvs9ashm-9-beon` y frontend `mvs9ashr-a-csjq`, con superficies disjuntas y contrato común. El padre ya retiró 34 archivos backend y cinco frontend del producto anterior; sus fuentes/pruebas de referencia están en `.browser/global-validation/profile-baseline/`, no son registros de PostgreSQL. La cobertura aplicable debe migrarse, no desaparecer. Backend entregado y comprobado, incluido verificador independiente con migración/concurrencia reales desechables. Frontend vigente134pruebas y backend96 aprobados; aceptación Chrome/API y actualización de desarrollo contrastadas por el padre. Las121pruebas/capturas históricas corresponden al flujo anterior y no acreditan este reemplazo.

Punto de partida separado: `aa0306425d40fb64456ebb639e7e2468ed3db2df`. Un solo PR futuro fue la forma elegida, no permiso para publicar/crear PR/merge. No se accedió a dotenv ni se stageó `.env.example`. Auditoría npm y revisión nativa histórica siguen sin aprobación.

### Unidad frontend de configuración global

Commit local `65f4fa2d69b8b4430504249519f1ed2cb52f61f6`, sobre `aa03064`: 43 archivos, 1009 adiciones y 1590 eliminaciones. Corte coherente de reemplazo completo frontend; la estrategia `single-pr` fue elegida por el usuario, sin reducir pruebas ni comprimir código para ajustar tamaño. No se publicaron commits ni se creó PR. El corte backend y las correcciones posteriores se documentan abajo; no implica aceptación integral.

- El writer frontend entregó `partial`: reportó **132 pruebas completas** y build/checker aprobados, pero dejó dos menciones a perfiles en `features/catalog/catalog.html`, fuera de su superficie de edición. El padre leyó editor/modelos, shell, motor de validación, helpers y exportación, y asumió esa corrección acotada.
- RED público del catálogo: comando `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs --include src/app/features/catalog/catalog.spec.ts`, exit 1, una prueba fallida y cuatro aprobadas por los textos antiguos. Tras corregir ambos textos, mismo comando GREEN, exit 0, **5/5** aprobadas. No se cambió la lógica de sincronización.
- Contraste completo propio después de la corrección: `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs && npm run build`, exit 0: **133 pruebas en 13 archivos aprobadas** y build aprobado. Fue la suite de ese corte; la vigente134 se registra abajo. No sumar las132delegadas, focalizadas ni121históricas. Bundle inicial **642,77 kB** frente a aviso 500 kB; presupuesto intacto.
- `node frontend/scripts/check-architecture.mjs` y `git diff --check -- frontend`: exit 0. Requisitos globales/contextos, revisión en diagnóstico/exportación, caché, fallos de edición y preservación del motor tienen cobertura automatizada; esto no acredita aún API real ni servidor nuevo.
- El worker conservó evidencia de preparación fallida: imports legados/errores TypeScript y ausencia de `matchMedia` no se cuentan como RED conductual; un glob sin comillas produjo argumentos inválidos. RED conductual sí observado en navegación con cambios pendientes y refresh que reaplicaba snapshot viejo; reportó GREEN 87 focalizadas antes de su suite de 132. Una fixture que modificaba cinco contextos fue corregida, no una regla del producto.
- ASSESS global escalado por item 1 devuelve plan con **verificador independiente obligatorio** para retiro irreversible (y contraste de concurrencia). ASSESS del rango frontend `aa03064..65f4fa2` sigue no evaluable por untracked, sin `reviewDue` ni continuación; no inicia revisión ni constituye aprobación. El plan medio del corte frontend no cancela la obligación de verificar la migración global.
- Migración/concurrencia y catálogo tienen contraste independiente; Chrome/API y Flyway en desarrollo propio comprobados abajo. Los límites de navegador y revisión/auditoría se conservan explícitos; no sumar evidencias históricas.

### Backend, verificación independiente y seamcheck corregido

- Backend `84a49e8377f57bd6fa8e8f2fc6f8dc13de9bf43e`: padre leyó V3/V4, servicio/decorador/store/repositorio, contrastó75/75fuentes/XML96sinfallos y ejecutó semillas3/codegen3/arquitectura12/checker/diffPASS. Paquete aprobado del writer se copió como JAR de ejecución; no se sobrescribió artefacto en uso ni se limpió el classpath del servidor existente. V1/V2, catálogo y procedencia oficiales intactos.
- Independiente: conjuntos exactos30/22/10/15/8 y3DROPacotados,85/85baseline,14/14observaciones HTTP crudas de catálogo idénticas. Primera fase S2/S7 UNAVAILABLE por dependencias ausentes. Humano autorizó copiar solamente repository/wrapper Maven al scratch específico, sin settings/credenciales/origen modificado. Continuación del mismo verificador: primer Maven offline19tests,exit0,0fallos/errores/omitidas,stderr0bytes,32.963s; actualización desde V1/V2, reinicio, concurrencia, rollback y API estricta PASS, sin bloqueadores residuales de ese alcance. No acredita toda UX ni aprobación nativa. Evidencia local: `.browser/global-validation/backend-check/` y scratch autorizado registrado en el documento de tareas.
- Seamcheck propio job33exit1: frontend133/buildPASS, backend96/0fallos/**1error** por home temporal de Tomcat durante dos arranques web simultáneos en la misma JVM. No fue timeout ni aserción SQL fallida. Log/XML preservados en `parent-seam-failed.log`/`parent-seam-failed-migration.xml`; disco del proyecto con946GBlibres.
- Corrección `3a7c682fc894fc1dae121056411762e5fc321ba1`: solo prueba concurrente con dos contextos no web, conservando Flyway/JPA/bootstrap simultáneos y comprobación de configuración única; HTTP/reinicio cubiertos aparte. Producto/JAR sin cambio. Focal2/2job35 y suite completa posterior job36 **96/96**,0fallos/errores/omitidas,exit0,39.167s. `java.io.tmpdir` explícito en scratch autorizado; nueva copia75/75en `parent-seam-input-manifest.json`. No ocultar el seamcheck fallido ni sumar estas ejecuciones.

### Contraste visual inicial y corrección local de radios

Instancia nueva aislada: PostgreSQL55433/API8081/frontend4201, JARcopiaSHA256 `fc7020a4ee61565cdf5e5c4bff060ba9158954afc0e793f818af2bdf6b6e2369`, sincronización catálogo deshabilitada solo allí. GET configuración rev0 igual a semilla, HTTP200 directo/proxy, profiles/upload404, esquema1–4 sin perfiles. Eso demuestra instalación nueva, no eliminación de datos preexistentes en desarrollo. CSVsintético12×30 se lee en navegador; no contiene disposition porque colección no lo exige.

Chrome propio `global-validation-e2e-01a18024`, cuatro capturas válidas abiertas bajo `.browser/global-validation/e2e/screenshots/`: contexto único, diagnóstico `subfamily`10de12 y contexto corregido escritorio/móvil. Primer screenshot falló por directorio inexistente; no se guardó ni ocurrieron los clics siguientes de esa cadena. Carpeta creada y recorrido público repetido correctamente; no se atribuye ese incidente al producto.

La captura real detectó radios grandes/azules por herencia de entrada de texto. Corte `b599464953f4c07aef86fdb4e33fc79c58cf5ddf`: solo override localradio+regresión, sin primitivas compartidas. REDjob38; primerGREENjob39 falló por matcherCSS sin encapsulaciónAngular, corregido sin quitar aserciones; GREENjob40 **13/13**. Job41 checker+**134pruebas/13archivos**+buildexit0; aviso **642,98kB/500kB**, presupuesto intacto. Chrome midió5radios18×18px/pineRGB(25,76,58), selección única, documento390px aviewport390; capturas escritorio/móvil abiertas. Foco/ArrowRight→solo permit y ArrowLeft→solo collection, foco-visible/outlineverde2px observados. Esas acciones invalidan resultados conservando archivo como corresponde.

### Aceptación UI/API completa y contraste del padre

Verificador `mvsrmxax-d-kpme` devolvió PASS del corte UI/API y cerró la sesión. Controles públicos: diagnóstico10/12, filas2–11/columna27, ayuda plegable, detalle único y foco restaurado mediante cierre/Enter; picker cerrado con Escape tras animación. Edición global: quitar subfamily solo en colección, cancelar guarda conserva29campos; guardar rev1 real invalida resultado reteniendo archivo/contexto/mapeo y produce0errores; restaurar mediante picker/guardar rev2 vuelve a10. Conjuntos finales iguales a baseline, sin atribuir recorrido interactivo a los otros cuatro contextos. Normalización con consentimiento explícito produjo0cambios legítimos; Finalizar vacío. Paso activo móvil dentro de231,39–366,39px.

Padre abrió las tres capturas `acceptance-detail-desktop.png`, `acceptance-detail-mobile.png`, `acceptance-final-mobile.png`; comprobó directamente JSONrev0/CSVrev0/JSONrev2 con10incidencias cadauno, filas2–11, contexto/revisión y sin claves de perfiles. Filtro visible0 no recorta descarga. Analizó HAR: dosPUT200 (revisiones0/1), exclusivamente `{revision,contexts}`, campos iguales/subconjunto del baseline; ningún archivo/celda/fila biológica ni nombre de fixture en solicitudes. GET posteriores200; workerGETstatus0 se considera emitido, no éxito HTTP. GET real final8081 rev2, campos restaurados, catálogo/status byteidénticos. Artefactos: `.browser/global-validation/e2e/{acceptance-report.json,parent-acceptance-contrast.json,acceptance.har,downloads/,screenshots/}`.

Incidentes no ocultados: refs obsoletos se refrescaron, clic durante animación de cierre no alteró datos, confirm bloqueó snapshot hasta cancelarlo, primer assert del texto de filtro esperaba otra frase y se corrigió al texto observable. No son defectos causales del producto ni RED funcional. Escape no cierra detalle inline (preexistente); cierre explícito/Enter sí restaura foco. No se repitió409 en navegador porque la API estricta/concurrencia ya tiene pruebas reales. No hay nueva auditoría exhaustiva de accesibilidad/seguridad.

### Aplicación autorizada a desarrollo existente

Tras aceptar UI/API, padre confirmó identidad/puerto del contenedor propio `universidad-normalization-dev-db`/55432/DBnormalization_dev y capturó antes3perfiles,1catalog_snapshot yFlyway1–2, hashes de filas yGET públicos. Detuvo solo backendjob3 de esta sesión; lanzó job43 con copiaJAR verificada, URL/usuario/puerto explícitos y localhost8080. Angularjob2/4200 permanece activo; no se usa ni cambia dotenv ni se sobrescribe un JAR en ejecución.

Job44exit0: configuración rev0/30–22–10–15–8 igual a semilla, Flyway1–4success, tabla `profiles`, trigger `immutable_published_profile` y función `preserve_published_profile()` ausentes. Hash/contador de catalog_snapshot y filasFlyway1–2 idénticos; catálogo/status HTTP byteidénticos en contraste inmediato antes/después de migración. `/api/profiles` y `/api/upload`404; configuración200 en8080 yproxy4200. Ningún DROP/DELETE manual: V4 retiró los tres registros al eliminar su tabla según permiso S7. Evidencia: `.browser/global-validation/development-update/{before-database.json,after-preserved-database.json,migration-report.json,before-*.json,after-*.json}`. Programación de catálogo habitual no se modifica; el contraste no afirma congelar sus futuros intentos legítimos.

**Límites vigentes:** advertencia bundle642,98kB/500kB; auditoría npm pendiente aceptada, sin repetición; ASSESS no evaluable poruntracked, sin revisión/aprobación nativa. No push/PR/merge. E2E API/frontend propios y PostgreSQL55433 cerrados (job45exit0, identidad confirmada); navegador cerrado. Desarrollo4200/8080/55432 permanece activo, sin tocar servicios ajenos.

## Historial: flujo de análisis de colecciones

Rama local `feat/normalization-data-treatment`, sin commit, push ni PR nuevos. Orden: archivo → contexto y validación → perfiles → mapeo → diagnóstico → normalización → finalizar. «Finalizar» permanece vacío. La comprobación de perfiles bloquea por encabezados obligatorios de severidad error aplicables al contexto; no bloquea por celdas vacías ni advertencias. No se aplican equivalencias automáticamente.

El mapeo agrupa columnas con datos antes de las totalmente vacías, con recuentos y separador fino «Campos sin datos» en la misma tabla, también al empezar páginas interiores del grupo vacío. `NULL` y `N/A` siguen siendo datos hasta aprobar su normalización. El diagnóstico resume faltantes por campo con registros afectados/total, sin contar dos veces la misma fila entre perfiles, y conserva detalle, filtros y descargas completas. El primer diagnóstico usa originales; aplicar normalización vuelve a validar una copia sin modificar el archivo.

| Comprobación nueva | Resultado observado |
|---|---|
| RED del flujo público | `npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs --include src/app/features/importer/workbench/import-workbench.spec.ts`: exit 1, cuatro fallidas y una aprobada antes de implementar |
| Agrupación delegada | RED exit 1 (cinco fallidas, una aprobada); GREEN exit 0 (seis aprobadas). El padre leyó cambios/pruebas y las contrastó después en la suite completa |
| Integración del flujo | Primera pasada: nueve aprobadas, dos fallidas por selector de prueba que no reconocía el número de los pasos; siguiente: 22 aprobadas, dos fallidas por fixture que duplicaba el destino `catalogNumber`. Se corrigieron las pruebas/fixture sin retirar aserciones de comportamiento |
| Focalizadas finales | Workbench, requisitos y evolución: 18 pruebas aprobadas, exit 0; cubren el ejemplo `subfamily` 10 de 12, contexto, bloqueo, normalización, originales, cancelación, unicidad, navegación y descargas |
| Suite frontend completa | `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs`: **113 pruebas en 13 archivos**, exit 0. Incluye pruebas estructurales del sistema de diseño y seis de agrupación; no sumar las focalizadas |
| Build | `cd frontend && npm run build`: exit 0. Advertencia: bundle inicial 644,16 kB frente al umbral de aviso 500 kB; no se cambió el presupuesto |
| Arquitectura | `node frontend/scripts/check-architecture.mjs`: exit 0 |
| Espacios/diff | `git diff --check`: exit 0 |

### Ampliación: ubicaciones desde estadísticas de faltantes

El conteo de valores vacíos abre una región inline paginada con encabezado y número de columna de origen (desde 1), campo mapeado, fila original y valores original/de trabajo. Conserva filas no contiguas y no duplica ubicaciones por perfiles. Las columnas completamente ausentes no ofrecen ubicaciones ficticias. El detalle puede cerrarse y se limpia al invalidar las entradas; `NULL`/`N/A` solo aparecen entre los vacíos con normalización aprobada.

- Worker: dos pruebas DOM nuevas en RED (exit 1, diez existentes aprobadas), un fallo intermedio por invalidación reactiva que cancelaba el parseo, luego GREEN **12/12** focalizadas (exit 0). El padre leyó helper, componente, plantilla y pruebas; contrastó el resultado con la suite completa siguiente.
- Padre: `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs` terminó con **115 pruebas en 13 archivos aprobadas**, exit 0. Es la suite actual completa; no sumar las 113 anteriores ni las focalizadas.
- Padre: `cd frontend && npm run build`, exit 0, con advertencia del bundle inicial **644,19 kB** frente a 500 kB. No se modificó el presupuesto.
- Padre: `node frontend/scripts/check-architecture.mjs` y `git diff --check`, exit 0.
- Segundo ASSESS sobre esta ampliación: no evaluable por untracked, sin `reviewDue` ni continuación; sin START ni aprobación nativa. La revisión visual real continúa pendiente por el mismo bloqueo de herramienta, sin reintentos.

### Auditoría UX/UI posterior con agent-browser

El usuario autorizó instalar `agent-browser` y Chrome globalmente para su usuario. CLI **0.40.0** comprobado; Chrome **156.0.8078.73** instalado en `/home/dark/.agent-browser/browsers/`. npm terminó exit 0 con postinstall bloqueado por su política; el CLI funcionó sin habilitar scripts ni cambiar configuración npm. El primer `open` falló por Chrome ausente; el diagnóstico offline confirmó la dependencia. La descarga local previa terminó pero se sustituyó por la global a pedido humano; no se borraron archivos.

Sesión propia `normalization-ux-01a18024`, cerrada al terminar. Recorrido mediante controles públicos, sin inyectar estado: CSV sintético de 12 registros/22 columnas, contexto Otros, perfil Museo, segunda página de mapeo, diagnóstico, detalle mediante Enter, cierre, descarga JSON, normalización sin cambios y Finalizar vacío; segundo CSV sintético con encabezados faltantes para comprobar bloqueo. Viewports **1440×1000** y **390×844**. Capturas guardadas y abiertas/inspeccionadas en `.browser/normalization/ux/`: `desktop-{contexto,perfiles,mapeo-vacios,diagnostico,detalle}.png`, `mobile-{diagnostico,detalle,normalizar,finalizar,bloqueo}.png`.

**Comprobaciones funcionales nuevas:**

- `subfamily`: resumen **10 de 12**, detalle **columna original 19, filas 2–11**, sin duplicación; `tribe` y `subtribe`: 12 cada una. El JSON descargado contiene **34 incidencias** con esos mismos recuentos y filas.
- La segunda página de mapeo muestra los dos campos totalmente vacíos tras el separador; la columna parcialmente vacía `subfamily` permanece entre las que sí contienen datos. El archivo incompleto muestra los encabezados faltantes y mantiene deshabilitado «Mapear columnas».
- Enter abre el detalle; el cierre funciona. «Finalizar» permanece vacío, tal como fue solicitado. No se modificaron opciones de normalización durante esta auditoría; no se atribuye nueva cobertura visual de sus transformaciones.
- HAR `auditoria.har`: cuatro entradas GET, ninguna operación de escritura ni nombre/contenido del CSV en solicitudes. Tres entradas de worker registran estado 0: se consideran solicitudes emitidas, no respuestas HTTP exitosas. No se afirmó que el HAR cubra tráfico anterior al inicio de grabación.
- GET públicos de perfiles y estado de catálogo son **idénticos byte a byte antes/después**, guardados como `before-*.json`/`after-*.json`. Esto contrasta metadatos, no prueba ausencia universal de efectos.

**Hallazgos de UX, no corregidos en esta auditoría:**

1. Al abrir el conteo conviven **tres tablas**: resumen, ubicaciones y detalle general que repite las mismas incidencias. La página alcanza **2992 px en escritorio** y **3862 px en móvil**, con el fixture de solo 12 registros.
2. El detalle repite por fila `subfamily`, el número 19, nuevamente `subfamily` y dos valores «(vacío)». La ubicación es correcta, pero el contexto común ocupa columnas innecesarias.
3. Tras enfocar el botón de cierre y pulsar Enter, `document.activeElement.tagName` es **BODY**, no el conteo que abrió el detalle: se pierde la referencia de teclado.
4. En móvil, el paso activo Diagnóstico queda fuera de la franja visible: posición horizontal x=563 frente al borde derecho del contenedor x=366. La franja no se desplaza automáticamente al avanzar.
5. No hay desborde horizontal de la página (**390 px** de contenido y viewport), pero las tablas de ubicaciones y de incidencias requieren desplazamiento interno: **517/341 px** y **672/341 px**, respectivamente. Para conocer valores originales/de trabajo hay que desplazarse lateralmente.
6. Perfiles muestra descripciones largas de las tres alternativas al mismo tiempo. Contexto y diagnóstico presentan varios párrafos de instrucciones; un resumen de tres campos y una vista previa vacía conservan paginadores y selectores sin aportar navegación útil.

**Conclusión:** comprobación funcional observada, pero la presentación no se considera aceptada en usabilidad. Propuesta pendiente de decisión humana: resumen compacto por campo/tipo, una única vista de detalle bajo demanda, mostrar campo/columna una vez en el encabezado, filas/valores sin repetir contexto y ayudas extensas plegadas. Mantener descargas completas y los tokens/controles existentes. No se modificó la interfaz ni se ejecutaron suites nuevas: es una auditoría, no una corrección. La instalación global y el recorrido resuelven el bloqueo histórico de herramienta de los apartados anteriores; no convierten las 115 pruebas previas en una aprobación visual ni en auditoría exhaustiva de accesibilidad.

### Simplificación autorizada tras la auditoría UX

El usuario aceptó aplicar la propuesta a todo el flujo con «Si.». La implementación conserva los siete pasos y los contratos: ayudas/descripciones extensas desplegables, resumen por campo y un único detalle bajo demanda. «Ver todas las incidencias» reemplaza el detalle de vacíos; las descargas permanecen completas. Campo y columna se muestran una vez; valores de trabajo solo cuando hay cambios. Paginadores de diagnóstico/normalización ocultos si todo cabe en una página. El cierre devuelve foco al disparador y el cambio de paso desplaza solo la franja horizontal.

**Comprobaciones automatizadas de esta simplificación:**

- Worker: RED exit 1 (10 fallos esperados y 25 pases); pasada intermedia exit 1 (3 fallos y 33 pases) por aserciones que asumían ausencia DOM del paginador en vez de `display:none` de PrimeNG; GREEN exit 0, **36/36** en cuatro archivos. No se retiraron las aserciones de visibilidad.
- Padre: fuentes, plantilla, estilos y documentación leídos; suite completa `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs`, exit 0: **120 pruebas en 13 archivos aprobadas**. No sumar focalizadas ni suites anteriores.
- Padre: `cd frontend && npm run build`, exit 0; aviso de bundle inicial **644,90 kB** frente a 500 kB, sin cambiar presupuesto.
- Padre: `node frontend/scripts/check-architecture.mjs` y `git diff --check`, exit 0.
- ASSESS sigue no evaluable por untracked, sin `reviewDue` ni continuación; no se inició ni se atribuye aprobación nativa.
- La primera aceptación Chrome encontró un caso no cubierto: reducir 1440→390 px sin cambiar Diagnóstico dejaba el paso fuera de vista (x563–698 frente al borde366; scrollLeft0). Se reprodujo antes de corregirlo. Worker añadió RED (1 fallida/31 aprobadas), luego GREEN **32/32**. La corrección comparte `scrollActiveStep()` entre efecto de render y listener `window:resize` gestionado por Angular; la prueba cubre ambos bordes, ausencia de movimiento vertical y limpieza al destruir.
- Padre, candidato final con resize: `cd frontend && npm test -- --watch=false --runner-config ../.browser/normalization/vitest.serial.config.mjs && npm run build`, exit 0: **121 pruebas en 13 archivos aprobadas**, build exit 0, aviso inicial **644,91 kB/500 kB**. Es la suite vigente, no se suma a las 120 anteriores. Checker de arquitectura y `git diff --check` también exit 0.

**Aceptación real del flujo compacto:** sesión propia `normalization-compact-01a18024`, Chrome global, viewports 1440×1000 y 390×844, cerrada al terminar. Los CSV se seleccionaron mediante el control de archivo, sin inyectar estado. Se abrieron/inspeccionaron nueve capturas en `.browser/normalization/ux-compact/`: escritorio de contexto, perfiles, resumen y detalle; móvil de resumen, detalle, incidencias filtradas, normalización vacía y detalle normalizado.

| Contraste observado en Chrome | Resultado |
|---|---|
| Vista inicial del diagnóstico | Una tabla, ningún detalle abierto y cero paginadores visibles para tres campos; ya no aparecen las incidencias completas de forma automática |
| Ubicaciones de `subfamily` | Diez registros, columna19 indicada una vez, filas2–11; dos columnas en vez de seis. En móvil, ancho341px y scroll341px: no requiere desplazamiento horizontal |
| Modos excluyentes | «Ver todas las incidencias» retira el detalle de vacíos y muestra el listado completo; los filtros siguen accesibles |
| Teclado y foco | Enter abre y enfoca el encabezado; cerrar devuelve el foco al conteo exacto o a «Ver todas las incidencias», según el disparador |
| Resize y navegación móvil | Tras 1440→390, Diagnóstico queda visible x231–366, `scrollLeft332`; también se observó Finalizar visible al avanzar. Página390px, sin desborde horizontal general |
| Ayudas | Ayuda de contexto abierta/cerrada mediante `summary`; descripciones de perfiles y explicaciones extensas inicialmente plegadas, sin borrar su contenido |
| Paginación | Resumen pequeño, detalle de diez filas y preview vacía sin controles visibles. Listado completo de34 incidencias conserva paginación; límites mayores cubiertos además por pruebas DOM |
| Normalización con cambios | Segundo CSV sintético: `subfamily` pasa de8 a10 vacíos al aprobar trim+marcadores. Filas2/3 conservan originales ` NULL ` y `N/A`; trabajo `(vacío)`. La tercera columna aparece solo con cambios; filas sin cambio muestran `—` |
| Finalizar | Vacío y paso activo visible, conforme al pedido |
| Exportaciones con filtros activos | JSON y CSV contienen **34 incidencias completas**, no el resultado filtrado; JSON conserva subfamily10 y filas2–11, tribe12 y subtribe12 |
| Tráfico y metadatos | HAR final seis GET, sin escrituras ni nombre/bytes del CSV. Cinco entradas de worker con estado0 no se atribuyen como HTTP exitosas. GET públicos de perfiles y estado del catálogo idénticos byte a byte antes/después |

Con el mismo fixture, la altura de la vista inicial pasó de2348 a1047px en escritorio y de3112 a1307px en móvil; con detalle abierto, de2992 a1611px y de3862 a1918px, respectivamente. Es una comparación de estas capturas/estados, no una métrica universal ni una aceptación humana de estética. El listado completo avanzado sigue siendo ancho y puede requerir desplazamiento interno en móvil, pero ya no se muestra por defecto.

Incidentes preservados: HMR recargó la sesión al aplicar el fix de resize, por lo que se repitió la selección pública del archivo y se separaron `intermediate.har` (47 entradas de desarrollo) y `final.har` (seis entradas). Un probe DOM falló por redeclarar una constante JavaScript en el contexto persistente del CLI; una nueva lectura encapsulada confirmó Finalizar vacío. No fue un fallo de producto, no se repitieron acciones de usuario para simular un resultado. No se ejecutó axe ni se afirma auditoría exhaustiva de accesibilidad/seguridad. Sin cambios backend, dotenv, datos vivos, dependencias de aplicación, commits o publicación.

### Límites históricos de la implementación antes de habilitar el navegador

- **Navegador real pendiente en la entrega inicial (resuelto para el recorrido posterior, con hallazgos abiertos):** `agent-browser skills get core` terminó con código 127 (`agent-browser: command not found`). No se instaló ni se intentó otro navegador. Las pruebas DOM y de CSS no prueban geometría, foco real, escritorio/móvil ni accesibilidad exhaustiva. Hace falta habilitar la herramienta o realizar aceptación visual humana.
- **Revisión nativa no evaluable:** ASSESS rechazó archivos untracked sin declaración explícita; no devolvió `reviewDue` ni continuación. No se inició una revisión ni se inventó aprobación; RDD permanece habilitado. No se accedió ni se stageó `.env.example` para eludir la protección.
- No se repitieron backend, semillas, Docker ni auditoría npm: no cambian código backend, contratos HTTP, datos o dependencias. La auditoría npm histórica sigue pendiente con aceptación humana.
- No hay CLI u opción nuevos que requieran diferencial de comandos. Las regresiones de los controles compartidos se contrastaron mediante sus pruebas públicas existentes, adaptadas solo al nuevo orden y a un fixture con encabezado obligatorio presente.
- Runner serial local ignorado `.browser/normalization/vitest.serial.config.mjs`: `maxWorkers: 1`, `fileParallelism: false`. No altera aserciones ni se presupone disponible en otro clon. Los originales, los dotenv y los datos MVP no se modificaron.

## Historial: Lombok, MapStruct y auditoría de los workers

Cortes locales de código: `d53a1e1` (generación), `8f7b381` (perfil) y `75395bb` (catálogo), sobre `8dab659`. No se publicó la rama.

**Comprobado por el padre sobre fuentes aisladas:** Lombok genera builders, constructores y accesores apropiados; cinco interfaces MapStruct generan conversiones HTTP, JSON y persistencia con `unmappedTargetPolicy=ERROR`. Los codecs Jackson usan `@Context`; las actualizaciones `@MappingTarget` no reemplazan la identidad administrada. El adaptador se llama `JpaCatalogStore`, los cuerpos Java usan imports/nombres cortos y se retiraron las tres carpetas vacías de fuentes/recursos. Sin cambios de contrato, esquema o datos vivos.

| Comprobación nueva de este pedido | Resultado observado |
|---|---|
| Configuración de generación | RED 3→GREEN 3; regresión de arquitectura RED 1/12→GREEN 12/12; checker real PASS |
| Corrección de builder | Compilación RED por sombreado de `Profile.Builder` sobre `@Builder`; nombre estándar `ProfileBuilder`, luego 20 focalizadas PASS |
| Builder de `Term` | RED por `builder()` ausente; prueba incorporada y GREEN dentro de la suite final |
| Suite final aislada | **185 pruebas en 15 clases, cero fallos, errores u omisiones**, Maven exit 0; las focalizadas son subconjunto y no se suman |
| Paquete aislado | `package -DskipTests` exit 0 después de la suite; JAR con API MapStruct 1.6.3 y sin Lombok, binding ni procesadores |
| Trazabilidad de fuentes | 82 SHA-256 del snapshot coinciden con fuentes/configuración/scripts del checkout actual; cinco `MapperImpl` generados y compilados |
| Contrato HTTP | **50/50 observaciones idénticas** frente al baseline nuevo de `8dab659`, incluidos estado, cuerpo exacto y headers; ambos runners exit 0 |
| Revisión independiente | **Perfil completo; catálogo completo; S1–S5 cumplidos, sin bloqueadores.** Contrastó 82/82 hashes, 50/50 respuestas, 185 tests/15 reportes, JAR, generados, API JPA mediante javap y scripts Python; no repitió Maven ni usó target compartido |

### Incidentes, alcance y límites

Los dos writers de perfil/catálogo terminaron con «assistant reported an error» y dejaron cambios parciales. El padre no los relanzó a ciegas: reprodujo los errores y reabrió la aceptación ante el pedido humano de comprobar todo el trabajo. Además del sombreado de `Builder`, corrigió tres imports de constantes que requerían `import static` y un consumidor de prueba del helper de estado convertido a MapStruct. Los primeros checks fallidos están conservados, no se presentan como GREEN.

`backend/target` contenía una implementación MapStruct anterior a su interfaz y un `.class` con stub `Unresolved compilation problem`; no se determinó qué proceso lo reescribió. La aceptación no usa esos artefactos: se copiaron solo `pom.xml`, `mvnw`, `.mvn`, `src` y `scripts` a `.browser/backend-lombok-mapstruct/candidate-audit`. El primer build limpio ejecutó 185 pruebas, con cero fallos y un error porque la copia omitía los fixtures `sources/tdwg`. Tras copiar exactamente los tres CSV oficiales, la suite completa y el paquete aprobaron. No fue un fallo del producto ni se omitió la prueba para pasar.

Evidencia durable ignorada en `.browser/backend-lombok-mapstruct/`: `baseline.{stdout,stderr,exit}`, `{resume-focused,corrected-focused,cleanup-green,cleanup-corrected,cleanup-final,isolated,isolated-corrected}.{stdout,stderr,exit}`, `audit-summary.json` y `candidate-audit/source-manifest.json`. No se usaron dotenv, datos vivos, servicios existentes ni pruebas de navegador nuevas. El verificador confirmó que `ProfileEntity.replace` sigue vivo por su constructor, por lo que no se borró por apariencia. Su primera lectura auxiliar buscó el manifiesto un nivel incorrecto (exit 1); corregida la ruta, los probes de aceptación dieron exit 0. Su scratch externo queda conservado: no se limpió sin autorización. No hace falta relanzar writers ni agregar el probe durable opcional como una nueva condición. No hay push ni PR autorizados. ASSESS sigue no evaluable por archivos untracked, sin `reviewDue` ni continuación: no se inventa START ni aprobación nativa ni se cambia RDD. Auditoría npm y demás límites históricos siguen sin resolverse.

Ver [especificación y pedido humano](odd/tasks/backend-lombok-mapstruct.md), [perfiles](backend/PROFILE_ARCHITECTURE.md), [catálogo](backend/CATALOG_ARCHITECTURE.md) y [configuración](backend/README.md).

## Historial: responsabilidades y empaquetado del backend

**Resultado comprobado:** perfiles y catálogo conservan núcleos Java puros y paquetes explícitos `domain`, `application` e `infrastructure`. Los mappers HTTP y de persistencia pertenecen a infraestructura; las fachadas web coordinan conversiones sin introducir DTO HTTP en aplicación. `Profile.builder()` construye por campos nombrados, sin sustituir validación ni reglas de negocio. `ProfileBeanConfig` y `CatalogBeanConfig` componen los adaptadores. Se mantienen bloqueos, transacciones completas y actualización de entidades administradas, sin cambios de contratos HTTP, esquema ni dependencias. Alcance: [T2, S2/S3/S5/S6/S7](odd/tasks/backend-layer-responsibilities.md).

**Diferencial aprobado:** 50/50 observaciones HTTP idénticas contra `af5edab`. Cortes locales de código: perfiles `a6bd16e`, catálogo `3b99fb1`; referencias `refactor/backend-profile-layers` y `refactor/backend-catalog-layers`. Sin push ni PR. La verificación independiente no encontró bloqueadores.

**Revisión nativa no disponible:** ASSESS, incluso con rangos `committedOnly`, rechazó la evaluación por archivos untracked sin declaración explícita. No devolvió `reviewDue` ni continuación; no se inventó START ni aprobación, ni se cambió el switch. El riesgo item 4 (concurrencia por reubicación transaccional/JPA) se cubrió con autoverificación y verificador independiente. La evaluación nativa fallida no se presenta como prueba aprobada.

| Comprobación de esta refactorización | Resultado observado por el padre o verificador |
|---|---|
| Focalizadas Maven | 8 pruebas de builder, mappers HTTP/persistencia de perfiles y mapper HTTP del catálogo; cero fallos, errores u omisiones |
| Suite Maven del padre | **171 pruebas en 13 clases de pruebas actuales**, cero fallos, errores u omisiones; las ocho focalizadas están incluidas, no se suman |
| Paquete | `bash ./mvnw package -DskipTests`: exit 0, después de la suite; no sustituye la ejecución de pruebas |
| Arquitectura | `python3 -B backend/scripts/test_architecture.py`: 10/10; `python3 backend/scripts/check_architecture.py` y `git diff --check`: exit 0 |
| Verificador independiente | Sin bloqueadores; compilación pura `javac`, 65 casos de núcleo y comprobaciones Python aprobados, sin repetir Maven compartido |
| Diferencial público | Baseline aislado `af5edab`, `ProfileContractTests`: exit 0 en 22 s; **50/50 diccionarios idénticos**, incluidos cuerpo exacto, estado y encabezados |

Desde `backend/`, el padre ejecutó `bash ./mvnw test` y `bash ./mvnw package -DskipTests`. Los conteos se contrastaron con las 13 clases de fuentes actuales, sin sumar XML obsoletos, ejecuciones focalizadas ni pruebas independientes. Los contratos req/res se aplican a cuerpos de negocio: se preservan JSON publicado del catálogo sin envoltorio, parámetros de ruta, `ProblemDetail` y operaciones sin cuerpo.

### Recuperación de evidencia y límites

El log temporal original del baseline se perdió al reanudar. El padre regeneró **solo el baseline** en `.browser/backend-layers/baseline-af5edab`, con PostgreSQL desechable; recuperó las 50 observaciones actuales desde los XML Surefire existentes, **sin repetir la suite actual**. La comparación de diccionarios incluyó cuerpo como cadena exacta, estado y encabezados. Artefactos ignorados bajo `.browser/backend-layers/`: `baseline-contract.stdout`, `baseline-contract.stderr`, `baseline-contract.exit`, `current-contract.json`, `http-contract-comparison.json` y `suite-summary.json`. El incidente no se presenta como una ejecución perdida aprobada sin respaldo.

El cierre documental es pasivo: lectura de documentos, contraste de ubicaciones Java y `git diff --check` acotado, sin RED significativo ni Maven nuevo. No agrega navegador, auditoría de seguridad, acceso a dotenv ni datos vivos. La auditoría npm pendiente aceptada y demás límites históricos permanecen. El padre conserva el registro de tareas y la decisión de commits/revisión/entrega.

Ver [backend/README.md](backend/README.md), [arquitectura de perfiles](backend/PROFILE_ARCHITECTURE.md) y [arquitectura del catálogo](backend/CATALOG_ARCHITECTURE.md).

## Historial: entorno raíz y arranque completo con Compose

**Implementado y probado:** `start.sh` valida el entorno raíz con Compose, compila Angular y el JAR y ejecuta `up --build -d --wait --wait-timeout 180`. `docker-compose.yml` es el único manifiesto principal; sirve frontend nginx, backend Java21 no root y PostgreSQL17. El datasource usa5432 por defecto, con override `DB_PORT`; todos los puertos publicados son loopback. Se conserva `universidad_museum_mvp_data`, nunca el volumen original `universidad_postgres_data`.

La plantilla `.env.example` fue asumida manualmente por el humano tras el bloqueo del harness. No se leyó, modificó ni stageó; la excepción de `.gitignore` permite versionarla manualmente, **no demuestra su publicación**. Tampoco se accedió a los `.env` reales. El antiguo `backend/.env` deja de consumirse, sin borrarlo; Compose utiliza únicamente el entorno raíz. Sin cambios de dependencias, contratos de API, migraciones ni registros biológicos.

| Comprobación | Evidencia observada |
|---|---|
| Test-first del arranque | Writer:15fallos iniciales→8pruebas Python PASS; casos de ayuda/argumentos, orden, rutas con espacios, fallo por etapa, datos intactos, entorno literal y modelo Compose con credenciales/puertos |
| Backend |163/163tests,0fallos/errores/omisiones ypackagePASS; incluye3EnvironmentDefaultsTests nuevos. Padre contrastó nueve XML correspondientes a fuentes actuales, sin sumar informes obsoletos |
| Contraste del padre |8PythonPASS4s,`bash -n start.sh backend/docker-healthcheck.sh` ydiffcheckPASS |
| Independiente previo |8Python+3SpringDefaults+modelo aisladoPASS, sin repetirlos en la continuación de runtime |
| Arranque real aislado |`start.sh` copiado sin modificar, ejecutado desde otrocwd:exit0,514paquetes instalados,Angular/Maven/Dockerbuild/upPASS;3/3healthy,backendUID999 |
| Proxy y recursos |Pornginx127.0.0.1:44622:HTML/SPA/JavaScript y`/api/catalog/status`/`/api/catalog`HTTP200;414términos,bundled,attempts0 |
| Datos y teardown |Modelo con proyecto/volumen/red propios, puertos efímeros loopback,ningúnvolumenoriginal;JARsin dotenv/passwordficticia;teardownowncontainers/networkexit0sin-v,volumenfixtureconservado |
| Licencias |Regresión estructural nuevaRED1→GREEN1; corrección deCOPY+allowlist. Build focalizadofrontend ylectura deimagenexit0:licencias39053bytes,SHA-256`ad9605479aca6631f34dc41e2c197174dde8945e82225c1e160d88efd5bafc29`;index2806bytes intacto |

La prueba real usó el directorio **expresamente autorizado** `/home/dark/projects/museum-compose-proof`. Un shim Docker exclusivo de la prueba sustituyó el proyecto fijo y agregó un overlay de aislamiento: solo proyecto, nombre de volumen, puertos efímeros y scheduler deshabilitado para no consultar TDWG durante la sonda. El modelo resuelto se validó **antes** del arranque. No se ejecutó el script sobre el checkout ni sobre el entorno real del usuario. El padre leyó `logs/result.json`: todos los comandos exit0 y salud/HTTP/resultados anteriores confirmados.

Comandos del producto: `./start.sh`, `./start.sh --help`. Pruebas: `python3 -B scripts/test_start.py` (o `PackagingTests` para la regresión focalizada),`bash -n start.sh backend/docker-healthcheck.sh`, Maven `test` seguido de `package -DskipTests`. La omisión de tests del segundo comando no sustituye los163ejecutados. No hubo RED Spring separado: el contrato de la unidad autorizó una ejecución integral Maven después de GREEN Python. La corrección de licencias solo reconstruyó la imagen frontend y extrajo el archivo mediante contenedor efímero sin red/read-only; **no repitió** npm/Maven ni el despliegue completo.

### Incidentes y límites conservados

- Primer intento real: capturador exit1 porENOSPC en/tmp tmpfs3.9GiB100%;stdout/stderr0bytes yexit/etapa del script irrecuperables. No se atribuye a npm,Maven oDocker ni se declaraPASS.
- El humano eligió «Pausar; yo libero espacio en /tmp». Tras «Ya quedo liberado, el espacio»,había1.4GiB;la continuación se detuvo enpreflight sinbuild/copias nuevas,al no poder cuantificar el tamaño final de620entradas del lock. No fue otro despliegue fallido.
- Después el humano autorizó específicamente `/home/dark/projects/museum-compose-proof` para una única prueba con temporales/cachés en disco. Ese intento real aprobó. No se borró /tmp ni se limpiaron scratches o volúmenes existentes.
- Se conservan el directorio autorizado y el scratch previo `/tmp/museum-independent-Kuyqvu`; la fixture durable `museum_diskproof_20261024_data` sigue presente. Los contenedores y red propios fueron retirados sin-v. La imagen de prueba de licencias tampoco se eliminó.
- El primer Dockerfile frontend omitía `3rdpartylicenses.txt`, generado fuera de`browser`. El padre detectó el problema, observóRED y añadióCOPY/excepción; la verificación focalizada de imagen confirmó bytes/SHA idénticos al build. La evidencia del resto del stack permanece vigente.
- Shellcheck no está instalado y no se instaló; se usó sintaxis Bash y pruebas funcionales. Bundle643,82kB/aviso500kB permanece. npm informó cuatro scripts de instalación bloqueados, sin impedir build/runtime. Sin nueva auditoría; la pendiente previamente aceptada no se convierte en aprobación.
- ASSESS escalado por riesgo5 (entorno) ypreservación1: no evaluable por untracked, verificación independiente realizada, **sin aprobación nativa**. Estas comprobaciones no son CI remoto ni auditoría exhaustiva, tampoco prueba de navegador/UI nueva.

Evidencia ignorada: `/home/dark/projects/museum-compose-proof/logs/{result,license-proof}.json`,stdout/stderr,modelo,HTTP,health yteardown. Las instrucciones vigentes están en[README.md](README.md),[backend/README.md](backend/README.md) y[frontend/README.md](frontend/README.md).

## Historial: revisión TanStack Query y DI soportada

T5 ejecutada **después** del cierre backend, por pedido humano. En Angular21.2.25/TanStack5.104.5 la declaración instalada `inject-query-client.d.mts:8` marca `injectQueryClient` deprecado y prescribe `inject(QueryClient)`; su implementación resolvía el mismo token. Se reemplazaron únicamente las dos inyecciones productivas de catálogo/perfiles, preservando proveedor, claves, callbacks, políticas, transporte y el orden de imports concurrente.

**Veredicto:** uso adecuado para metadatos del MVP. Cliente raíz único con mount/unmount; claves estructurales estables; consultas como Promise con AbortSignal hasta fetch; mutaciones separadas, invalidación de perfiles onSuccess y catálogo onSettled; sin cache de registros biológicos ni persister. No hay requisito automático de `enabled` para lecturas globales sin parámetros ni de migrar a HttpClient. Ver [QUERY_USAGE.md](frontend/QUERY_USAGE.md) para rutas/versiones y salvedades de errores/refetch.

| Prueba nueva | Resultado |
|---|---|
| RED esperado, producción intacta |1fallo/9pases: guarda de clase compilada detecta `injectQueryClient`; las nueve pruebas funcionales ya aprobaban |
| GREEN tras DI equivalente |10/10focalizadasPASS |
| Suite/build del writer |99pruebas/11archivosPASS,buildPASS; warning643,82kB/500kB intacto |
| Contraste del padre |Nodechecker+10/10focalizadas+diffcheckPASS,8s; sin cambio productivo adicional |

Los diez casos cubren identidad del cliente, ciclo de vida, cuatro acciones de perfiles y cuatro resultados de sincronización con refetch real sobre API simulada. La ausencia del alias necesita una guarda estructural porque ambas funciones DI tienen comportamiento equivalente. No se inventó una diferencia funcional para conseguir RED.

El primer writer terminó parcial: dos errores de hoisting con0tests y una ejecución10/10fallida por metadataApp sin compilar; no eran RED válido. Tras «Review the delivered subagent output and continue.», una corrección acotada registró imports standalone, setup asíncrono y `await TestBed.compileComponents()`, sin relajar assertions/timeouts ni cambiar producción para ocultar fallos. Después observó el RED específico y los pases anteriores. Sin API viva, navegador, instalación/audit, cambios backend o dependencias nuevos. ASSESS no evaluable por untracked, plan selfVerification cumplido, sin aprobación nativa.

Comandos: `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs --include=src/app/testing/query-usage.spec.ts` (RED/GREEN y contraste); suite sin include; `node scripts/check-architecture.mjs`; `npm run build`; `git diff --check`. Las salvedades existentes (refetch de perfiles no esperado por el callback, escritura ambigua ante fallo de red, abortos convertidos en error genérico) quedan documentadas, no corregidas subrepticiamente ni consideradas requisitos nuevos.

## Historial: backend hexagonal preservador

**Resultado:** `profile` y `catalog` tienen núcleo Java puro (`domain`, `application`), puertos, adaptadores y composición Spring explícita. Perfil conserva una transacción por operación completa; catálogo conserva la descarga fuera de transacción y la activación contra el snapshot bloqueado. No cambian esquema, recursos, dependencias, contrato HTTP ni datos vivos. Skills instaladas utilizadas: hexagonal-architecture, Java, Spring Boot, JPA, TDD y verificación Spring.

| Comprobación nueva | Resultado observado |
|---|---|
| Baseline antes de migrar | Job1:68/68tests,0fallos/errores/omisiones;50observaciones públicas guardadas |
| Núcleos | Ambos compilados mediante `javac` sin frameworks por writers/verificadores |
| Arquitectura | REDexit1 sobre paquetes antiguos→GREEN tras extracción;5regresiones del checkerPASS |
| Perfil independiente |92testsPASS y50/50observaciones idénticas; sonda adicional93PASS comprueba proxy real y rollback SQL completo |
| Catálogo independiente |65testsPASS, incluidas8/8carreras mixtas, transporte, estado durable y reinicio con PostgreSQL desechable |
| Integración padre | **Job3:160/160tests**,0fallos/errores/omisiones,8clases realmente ejecutadas; **packagePASS** |
| Diferencial padre | **50/50observaciones idénticas**: estado, cuerpo como cadena exacta y encabezados; no se normalizaron diferencias para ocultarlas |
| Recursos/contratos | `git diff` vacío para `backend/pom.xml`, `backend/src/main/resources` y `sources/tdwg`; sin nuevas migraciones ni dependencias |

Las tres sondas independientes incorporadas son `lifecycleOperationsUseOneTransactionalProxy`, `bootstrapDatabaseConflictRollsBackEarlierSeeds` y `CatalogLockedCurrentPolicyTests`. La primera comprueba un solo bean proxificado, transacciones REQUIRED y read-only únicamente en listado; las otras fijan rollback total ante conflicto SQL y conservación frente a un candidato descargado antes que el snapshot vigente. Se agregan a las integraciones PostgreSQL, no las sustituyen por mocks. Perfil94+catálogo66=160; no sumar ejecuciones independientes ni históricos para inflar ese total.

### Comandos y artefactos

Desde raíz: `python3 -B backend/scripts/test_architecture.py`, `python3 backend/scripts/check_architecture.py`, `git diff --check`. Desde backend: `bash ./mvnw test && bash ./mvnw package -DskipTests` (job3). El segundo comando omite pruebas porque el primero acaba de ejecutarlas; no describe una suite omitida. El baseline y el candidato generan las observaciones `PROFILE_CONTRACT` mediante MockMvc con reloj fijo/UUID normalizados. Artefactos ignorados: `.browser/backend-hexagonal/{baseline-contract,final-contract}.jsonl`.

Unidades locales: perfil `a9d783c` (734+/185-), catálogo `16baee4` (765+/191-). Son extracciones verticales con sus pruebas y docs, no commits por tipo de archivo. Superan la heurística400 por cohesión; no se minificó ni omitió código para reducir el conteo. Primera unidad comprobada independientemente contra el catálogo anterior; no necesita una mitad futura para compilar.

### Fallos, consentimiento y límites

- Job2 no aprobó:157tests,0fallos de aserción,61errores de contexto. Quedaban `.class` antiguos junto a los reubicados, produciendo `ConflictingBeanDefinitionException` entre ambos `CatalogConfiguration`. Se archivaron `target/classes` y `target/test-classes` en `.browser/backend-hexagonal/stale-compiled-20261024-021348`, sin borrados ni tocar JAR/runtime; job3 reconstruyó y aprobó. No fue un timeout reintentado ni se debilitó una prueba.
- Un postcheck inicialmente sumó todos los XML Surefire y obtuvo186 por26informes históricos ajenos a esta ejecución. Falló su aserción; se corrigió contrastando las ocho clases del log actual con sus XML. El total nuevo real es160, no186. No se reejecutó Maven para corregir el contador.
- El escritor de catálogo informó parcial por diez ubicaciones físicas antiguas, aunque ya declaraban paquetes nuevos. El padre las reubicó sin sobrescribir destinos; checkerGREEN y verificación posterior cubren el resultado final.
- Preparación destructiva del scratch de perfil fue bloqueada antes de ejecutarse. Se usó archivo baseline separado y tar con exclusiones, sin borrados. La autorización humana posterior permite a verificadores leer/copiar **solo** `/home/dark/.m2/wrapper` y `/home/dark/.m2/repository` a su scratch, sin red, credenciales, settings ni escritura original. El catálogo había quedado pendiente de ese consentimiento: su continuación ejecutó Maven por primera vez, no reintentó un test fallido.
- El verificador de catálogo informó posible escritura externa de preferencias JShell antes de fijar `java.user.home`; no se inspeccionó ni limpió una ruta externa ni se inventa resolución. La ejecución Maven posterior confinó HOME, temporales, caché y preferencias al scratch. Los scratches comunicados por trabajadores/verificadores se conservan; no hay autorización de limpieza externa.
- GET opcional al runtime8080 agotó10s **antes** de cambios; `ss` confirmó ausencia de listener. No se reinició runtime ni se compararon nuevamente los nueve perfiles vivos. La nueva evidencia funcional proviene de PostgreSQL aislado y comprobación de recursos/esquema inalterados; no se tocó la base viva ni la original.
- ASSESS escalado por riesgos1/4, también por cada rango de commit, sigue no evaluable por untracked: verificación independiente requerida y cumplida, **sin aprobación nativa**. No se instalaron SpotBugs/PMD/Checkstyle/JaCoCo/OWASP ni se afirma cobertura o auditoría de seguridad. Auditoría npm pendiente aceptada permanece intacta. Sin push/PR.

Ver [backend/README.md](backend/README.md), [perfiles](backend/PROFILE_ARCHITECTURE.md) y [catálogo](backend/CATALOG_ARCHITECTURE.md). La petición posterior de revisar `injectQueryClient` y TanStack Query se registra como T5; no forma parte de estos commits ni de esta aceptación backend.

## Historial: arquitectura frontend y sistema de diseño integrados

**Resultado funcional comprobado:** frontend por funcionalidades `catalog`, `profiles`, `importer`, modelos con propietario único, transporte/i18n en `core`, selector en `shared/ui` y sistema de diseño real en `shared/design-system`. Componentes grandes con HTML externo; no quedan rutas antiguas ni barrels de compatibilidad. `src/styles.scss` importa primitivas y especializaciones en orden explícito. `MuseumPreset` y CSS consumen una sola paleta; shell/primitivas usan tokens semánticos, espacios y radios. No se cambió API, parser, validación, dependencias ni datos.

### Unidades y evidencia

| Unidad | Evidencia observada |
|---|---|
| Baseline UI | `a0e6ca9`: RED3fallos/10pases→13/13focused y navegador S4–S6. Job48suite83/84 agotó hook10s; build omitido. Solo tras autorización humana explícita, job49 serial84/84+buildPASS sin ampliar límites ni cambiar aserciones. |
| Empaquetado | `491397d`: writer estructuralNode0/diffcheck0, sin Angular. Padre transfirió su patch frontend del worktree aislado, reejecutó checker y contrastó ocho cuerpos de motor/API/i18n/picker idénticos salvo imports contra baseline. Tres ejemplos originales byte iguales. |
| Sistema de diseño | `f838b81`: writer extrajo SCSS/preset y escribió cinco tests; no los ejecutó. El padre integró preset/shell y ejecutó realmente esos cinco junto a la suite. |
| Costura integrada | **Job50: checkerNodePASS,20/20focalizadas,89/89suite frontend ybuildPASS**, con runner local secuencial. Worker de62,17kB emitido. Bundle643,88kB/500kB: advertencia, presupuesto intacto. |

No se inventó RED para movimientos preservadores. Las unidades de extracción superan400líneas por mover bloques cohesivos con pruebas/docs; no se minificó para reducir el diff. El checker `node scripts/check-architecture.mjs` usa solo Node y protege ubicaciones, imports/recursos, dirección de dependencias, contratos únicos y URL del worker; no reemplaza pruebas ni navegador.

### Navegador posterior al refactor

Chromium real mediante CLI existente, sesión `museum-architecture-final-01a16167`,1440×1000 y390×844, **cerrada**. Solo controles públicos y lecturas DOM; sin inyección de estado ni respuestas simuladas.

- Worker realmente carga desde su nueva ubicación: CSV inválido con combinado27errores+1advertencia, CSV válido0/0, XLSX `Complete`1registro/30columnas0/0. Se eligió hoja con teclado nativo. Volver a mapeo y al diagnóstico conservó el resultado.
- Descargas JSON/CSV contienen las mismas28incidencias, con filas de origen; contraste completo tras convertir representación CSV de fila a número/null.
- Selección de equivalencia: relleno/borde `rgb(25,76,58)`, texto blanco y sin sombra interior; foco de input sin outline, fila resaltada, separadores de1px y sin zebra. Etiqueta específica de hoja conservada.
- Perfil publicado Museo+SiB: todas las entradas/selectores/textarea deshabilitados, selector con `catalogNumber`; diálogo cerrado sin guardar. Nueve perfiles completos iguales antes/después, incluidos tres borradores; sin eliminación/ocultamiento.
- Sincronización móvil real: pendiente con spinner→SUCCESS. Botón238×44,09375px y región de estado112px con **rectángulos completos idénticos** en los tres estados. Selectores44,09375px/14px; documento390px, sin desbordamiento global y pie separado del main. HAR manual:1POSTvacío+GET.
- HAR del análisis CSV/XLSX:8GET, sin cuerpos ni nombres de los tres archivos en solicitudes, sin subidas. No se usa status0 deHAR como prueba de HTTP200; el éxito de sincronización se observó en UI y su respuesta de operación.
- Registro de errores de página vacío. Capturas abiertas e inspeccionadas: `screenshot-1792782980782.png` (mapeo escritorio), `screenshot-1792783072082.png` (publicado), `screenshot-1792783073209.png` (carga móvil), `screenshot-1792783091759.png` (mapeo móvil). Resumen machine y artefactos en `.browser/frontend-architecture/final/`, ignorados porGit.

Comandos realmente usados: `node scripts/check-architecture.mjs`; `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs` (con includes focalizados antes de suite completa); `npm run build`. CLI con `--session museum-architecture-final-01a16167 --screenshot-dir /home/dark/projects/universidad/.browser/frontend-architecture/final --download-path` en ese directorio: upload de ejemplos mediante input público, selección de perfil, clics en pasos/equivalencias, foco/hover, `download`JSON/CSV, `network har start/stop`, hoja mediante ArrowDown/Enter, publicado/cierre explícito, sincronización y `close`. Evaluaciones de lectura midieron cajas/estilos/disabled, nunca mutaron estado de aplicación.

### Incidentes y límites preservados

Primer explorador agotó4min trasfind, sin mapa. Un único intento acotado autorizado entregó evidencia limitada, luego contrastada. Primer dispatch del escritor de empaquetado fue rechazado antes de crear tarea por intersección conservadora de globs; no se ignoró la guardia: se creó/registró un worktree del mismo clon en `.browser/worktrees/frontend-packaging`. Sus cambios frontend se trasladaron mediante patch; ese worktree auxiliar conserva su copia/staging, sin limpieza destructiva ni instalación de dependencias. La copia de registro allí no es autoridad del feature: el registro canónico es `odd/tasks/frontend-architecture.md` en la raíz.

El timeout job48 permanece como fallo observado; no demuestra defecto productivo ni su causa se deduce solo de carga/swap del host. Job49 fue exactamente la ejecución adicional autorizada. El runner temporal solo limita paralelismo; no aumenta timeouts ni omite pruebas. Los resultados del baseline no se atribuyen a los writers ni sustituyen job50.

ASSESS de writers y rangos committedOnly de ambas unidades siguió no evaluable por untracked: plan de verificación propia, sin revisión/aprobación nativa. No nueva auditoría; la auditoría previamente agotada sigue pendiente aceptada. Backend y semillas no se reejecutaron porque no cambiaron. No push/PR ni archivos ajenos modificados, tampoco limpieza de capturas/scratchs externos históricos.

## Historial: baseline visual previo a reorganizar frontend

T1 de `odd/tasks/frontend-architecture.md`: etiqueta «Seleccione la hoja de cálculo que desea analizar»; equivalencia seleccionada con fondo y borde `rgb(25,76,58)`, texto blanco y `box-shadow:none` incluso en hover; input y selector enfocados sin outline amarillo, conservando borde verde, resaltado de fila y foco de teclado en botones/enlaces.

REDjob47:3fallos/10pases. Job48:13/13focalizadas, pero suite83/84 con timeout10s en preparación de app.spec; comandoexit1 tras4m44 y build no ejecutado por&&. No se reintentó automáticamente. Diagnóstico de metadatos del host mostró carga alta y swap llena, sin demostrar causalidad. Usuario autorizó exactamente un intento secuencial (`authorize_one_serial_frontend_suite`), con maxWorkers1/fileParallelismfalse y sin ampliar límites o cambiar aserciones. **Job49:84/84 ybuildPASS**,15s. Configuración local temporal `.browser/frontend-architecture/vitest.serial.config.mjs`, no configuración del producto. Warning640,61kB/500kB conservado.

Chromiumreal1440×1000, acciones públicas: CSV de ejemplo, perfil combinado, mapeo, selección de equivalencia, hover y foco de input; XLSX y espera de etiqueta exacta. Medidas `.browser/frontend-architecture/t1-selection.json` y `t1-focus.json`; captura `screenshot-1792781196092.png` abierta e inspeccionada. Sesión propia `museum-architecture-01a16167` cerrada, sin guardar perfiles. Modelo API/worker y dependencias intactos; no repetir backend/semillas para estas reglas de presentación.

ASSESS no evaluable por untracked; plan de verificación propia, sin revisión/aprobación nativa reclamada. La reorganización T2/T3 y la aceptación final T4 aún están pendientes en el registro, no se presentan como terminadas aquí. Sin nueva auditoría ni push/PR; archivos ajenos preservados.

## Historial: bordes de mapeo suavizados

Últimas correcciones solicitadas: sin fondos alternos; separadores horizontales **1px**, borde izquierdo de `source-header` **1px**, resaltado al enfocar y pasar el cursor conservado. README y regresión CSS actualizados; sin cambios de lógica, datos o backend.

Pruebas: job43 RED1fallo/8pases→job44GREEN9/9+81/81/build; el pedido adicional del borde izquierdo produjo job45 RED1fallo/8pases→**job46 final9/9focalizadas+81/81suite ybuildPASS**. Warningbundle640,57kB/500kB, presupuesto intacto. Backend/semillas no repetidos por ser presentación localizada.

Chromium real: dos filas blancas en reposo; enfocar el input de la primera produce `rgb(226,238,230)` solo en esa fila, dejando la segunda blanca. Bordes izquierdo e inferior medidos1px. Capturas `.browser/mapping-soft/screenshot-1792768395065.png` (antes del ajuste izquierdo) y `screenshot-1792768534534.png` (final), ambas abiertas e inspeccionadas; `neutral.json`, `focused.json`, `left-final.json` conservan las medidas. Acciones públicas: cargar CSV de ejemplo, elegir perfil, ir a mapeo y enfocar input; evaluaciones DOM de lectura, sin inyectar estado ni guardar perfiles. Sesión propia `museum-mapping-soft-01a16167` cerrada.

RDD on; ASSESS no evaluable por untracked, plan de verificación propia sin independiente; sin aprobación nativa. Sin nueva auditoría, commit/push/PR ni cambios en archivos ajenos.

## Historial: separación, selectores, TDWG y paginación

Cambio frontend posterior a la distribución compacta; conserva sus ajustes y no modifica backend, dependencias, API, validación ni los nueve perfiles.

| Pedido | Comprobación observada |
|---|---|
| Separar encabezados | Filas de mapeo con fondos alternos, separador2px y realce al pasar el cursor/enfocar. Encabezado de origen una sola vez en cabecera, sin repetir «Origen» en cada fila. Captura escritorio abierta e inspeccionada. |
| Estandarizar listbox | Nativos, PrimeNG y paginadores:44,09375px de altura,14px de tipografía,borde `rgb(174,191,182)` y radio5px, medidos en catálogo. Tokens compartidos para foco, deshabilitado y opciones PrimeNG. No se migraron los controles nativos: su ventana de opciones depende del navegador/SO. |
| Mejorar TDWG | Acción junto al encabezado/contador, filtros separados, icono/spinner y región de estado permanente. Móvil390×844: botón **238×44,09375px** y estado **112px** con rectángulos completos idénticos en reposo, pendiente y éxito; documento390px. `pending:true`,spinner observado y éxito real. HAR final:1POST `/api/catalog/sync` sin cuerpo+GET. |
| Cantidad por tabla | Catálogo15→30 filas visibles; mapeo12→25; normalización10→25 de30cambios; diagnóstico20→28 al elegir50; perfiles seleccionados25 con9filas. Cantidades iniciales anteriores conservadas. |

La normalización se ejerció con una copia local del CSV válido, agregando espacios a sus30celdas, sin modificar el original. El recorte explícito produjo30cambios y0errores/0advertencias. CSV erróneo con combinado:27errores+1advertencia antes/después de elegir50. Nueve perfiles completos iguales en GET antes/después; registro de errores de página vacío. Sesión propia `museum-consistency-01a16167` cerrada.

**Pruebas:** job39 RED4aserciones fallidas por funciones ausentes,15pases y una prueba nueva que agotó5s; ese timeout es un fallo, no se lo presenta como RED funcional confirmado ni se aumentó el límite. Tras implementar el candidato nuevo, job40 aprobó20/20focalizadas,80/80suite/build. La inspección real detectó dos defectos adicionales: etiqueta TDWG partida con salto de altura53,75→44,09px y fuente nativa12,88px frente14px del paginador. Se fijaron regresiones: job41 RED2fallos/7pases; corrección de altura/ancho fijos, nowrap y tipografía común. **Job42 final:9/9focalizadas,81/81suite ybuildPASS**. Bundle640,84kB frente500kB: advertencia sin cambiar presupuesto. Backend y semillas no se reejecutaron porque no se tocaron.

**Incidentes de automatización, no pases:** primera evaluación tras HMR buscó el botón en una sección distinta; se navegó a catálogo y esperó el control. Un intento de cantidad en preview vacío no abrió opciones porque estaba deshabilitado; se comprobó luego con30cambios reales. Una búsqueda de opción50 fue anterior al montaje del overlay; se esperó su estado observable. Un selector demasiado amplio apuntó al workbench oculto al navegar a perfiles y recibió clic cubierto; se acotó a `app-profiles`. No hubo inyección de estado, simulación de respuestas ni escrituras de perfiles.

Comandos del candidato final: `cd frontend && npm test -- --watch=false --include=src/app/layout.spec.ts && npm test -- --watch=false && npm run build`. Navegador existente con sesión propia y `--screenshot-dir /home/dark/projects/universidad/.browser/control-consistency`; `network har start/stop`, clic en sincronizar, lecturas DOM de cajas/estilos, espera de botón habilitado; en paginadores, clic en `.p-paginator-rpp-dropdown .p-select-dropdown`, espera de `[role=listbox] [role=option]` y selección por nombre. Para perfiles se acotó a `app-profiles`. Archivos cargados únicamente mediante input público; se cerró la sesión con `close`.

Evidencia local ignorada: `.browser/control-consistency/` conserva geometrías, cantidades, HAR y perfiles. Capturas abiertas: `screenshot-1792762006303.png` (filas escritorio), `screenshot-1792762212426.png` (catálogo móvil corregido), `screenshot-1792762304388.png` (pendiente final), `screenshot-1792762305755.png` (mapeo móvil). Las primeras capturas desktop de sincronización documentan el candidato previo a corregir la altura, no son prueba del tamaño final.

RDD sigue on; ASSESS final no evaluable por untracked, plan de verificación propia sin verificador independiente. No se inició revisión ni se afirma aprobación nativa. Sin nueva auditoría, commit/push/PR ni modificación de archivos ajenos. README actualizado; límites y comprobaciones históricas quedan separados debajo.

## Historial: distribución compacta y main expandible

Cambio exclusivamente frontend posterior a `6936cd3`; no reabre las tareas anteriores ni modifica API, parser, validación, dependencias o perfiles.

- `main` mantiene el mínimo anterior y crece verticalmente con el contenido. Chromium1440×1000: antes/después corto **1150×853,21875px** exactos; mapeo largo **969,4375px** de alto. Ancho de documento1440 en viewport1440. El pie sigue el flujo debajo del contenido.
- Reglas: seis campos en **tres columnas/dos filas** en escritorio; botón «Eliminar regla» debajo sin cambio. Móvil: una columna, diálogo362px dentro de viewport390px. Perfil nuevo de comprobación descartado, sin guardar.
- «Colección biológica.» es la primera opción de contexto; ninguna opción queda preseleccionada por este cambio. Combinación/exclusividad y claves del worker conservadas.
- Mapeo: destino y «Limpiar» pequeño en el mismo eje; todas las sugerencias en una franja horizontal a la derecha, sin prefijo «Usar». Filas medidas60,47px, botones31,5px. Cuando no caben, hay desplazamiento local; móvil tabla728px en región341px, documento390px/viewport390px. Selección de sugerencia y limpieza comprobadas en controles públicos.
- Excel: margen superior medido **14px** entre selector y acción de lectura. Hoja `Complete` elegida con teclado nativo y leída:1registro/30columnas.
- CSV erróneo, perfil combinado y Otros:27errores+1advertencia. GET perfiles antes/después: mismos nueve objetos completos. Sin errores registrados de página. Sesión propia `museum-compact-01a16167` cerrada.

**Pruebas nuevas observadas:** RED9fallos/5pases; primer intento GREEN13pases/1fallo por regex que omitía los atributos de encapsulación Angular del CSS compilado. Corregida únicamente esa aserción manteniendo la comprobación de ancho automático. Resultado: **14/14 focused y76/76 suite frontend**, buildPASS (job38). Advertencia de bundle inicial636,88kB frente500kB; no se modificó el presupuesto. Backend y semillas no se reejecutaron: no se cambió su comportamiento ni código. No convertir la suma con resultados históricos en una suite nueva.

**Límite de automatización:** `agent-browser select ... Complete` informó éxito, pero la primera lectura resultó2registros/6columnas de `With errors`; esa captura no prueba lectura de `Complete`. Después, con teclado ArrowDown/Enter sobre el selector nativo, el valor observado fue `Complete` y la lectura1×30. No se cambió el producto para acomodar la herramienta. Una lectura de diagnóstico tomada durante «Procesando localmente» tampoco se contó como resultado: después se esperó «27 errores» y se capturó el diagnóstico concluido.

Comandos de pruebas:

```bash
cd frontend
npm test -- --watch=false --include=src/app/layout.spec.ts --include=src/app/app.spec.ts --include=src/app/evolution.spec.ts
npm test -- --watch=false
npm run build
```

Navegador existente, sin instalar/actualizar; `--session museum-compact-01a16167 --screenshot-dir /home/dark/projects/universidad/.browser/compact-layout`, ejecutable Chromium del proyecto. Se usaron `upload 'input[type=file]' .../examples/records-with-errors.csv`, `check @e13`, `click @e20`, selección/limpieza, `set viewport 390 844`, contexto/Otros/validación; luego «Crear perfil»/«Agregar regla»/«Cerrar editor» sin guardar. Para Excel: `focus '.upload select'`, `press ArrowDown`, `press Enter`, `get value '.upload select'`, clic en «Leer la hoja seleccionada», `wait --text '30 columnas'` y `close`. Evaluaciones DOM exclusivamente de lectura midieron cajas/estilos; no se inyectó estado ni se simularon respuestas.

Artefactos locales ignorados por Git: `.browser/compact-layout/` contiene baseline, geometrías, nueve perfiles antes/después, diagnóstico, lectura XLSX y errores. Capturas abiertas e inspeccionadas: `screenshot-1792730139787.png` (mapeo escritorio), `screenshot-1792730173703.png` (móvil), `screenshot-1792730219666.png` (regla3×2), `screenshot-1792730247578.png` (selector XLSX móvil; el margen del botón se prueba con geometría, no con su visibilidad en ese recorte).

RDD sigue on; ASSESS devolvió `unassessable` por archivos untracked y plan de verificación propia, sin verificador independiente. No se inició revisión nativa ni se afirma aprobación. No nueva auditoría. Archivos ajenos, datos y perfiles intactos; sin push/PR.

## Historial: refinamiento Java/JPA e importación

**Aceptación funcional comprobada por el padre:** separación DTO/JPA, progreso navegable, selector único, marco estable y sincronización manual. Los nueve perfiles, incluidos tres borradores, permanecen íntegros y visibles; no hubo eliminación ni ocultamiento. Registro: `odd/tasks/museum-refinement.md`.

### Pruebas y atribución actuales

| Unidad | Evidencia observada |
|---|---|
| T1, S1–S7 | `724f167`: DTO `profile/dto/req` y `dto/res`, getters JavaBean, excepción `shared/exceptions`, Jackson `.asString()`, pruebas en `profile` con EntityManager. Escritor: 52 pruebas/paquete y 50 observaciones HTTP diferenciales; 41 rechazos conservaron perfiles completos. Independiente: 52/52, trigger real y concurrencia aprobados. |
| T2, S8–S11 | `12ae950`: escritor RED5→66/66 y build; preservación base62. Independiente: 66/66/build y sonda real Profiles/FormField67 candidato/62 base. Sonda exacta fijada en `5d77e84`; padre1/1. Geometría real y capturas contrastadas abajo. |
| T3, S12 | `bc7b139`: padre RED API24/7fallos por ruta inexistente y carrera que no pudo empezar; UI4fallos por botón ausente. GREEN59backend/paquete y UI4focused. Costura:6semillas+71frontend/build. Independiente:59/71,16 observaciones HTTP diferenciales exactas y12rechazos binarios con entidad intacta. Sin bloqueadores de producto. |
| Regresiones T3 | `923cc83`: padre fijó rechazo binario y ocho carreras usando estado público. Job34:9/9; job35: **68/68 backend**, sin omisiones. La suite frontend71 y semillas6 ya habían pasado en job30. **Total actual:145 pruebas (68+71+6)**; build Angular y paquete Maven aprobados. No se repitieron las suites del verificador. |
| Límites | Bundle inicial636,27kB frente a objetivo500kB: advertencia, no se alteró el presupuesto. Auditoría npm pendiente aceptada, sin nuevo intento. ASSESS nativo no evaluable por archivos untracked; no hay aprobación nativa ni recibo reclamados. |

El verificador T1 tuvo una primera suite con exit1:45 contabilizadas/37errores/8aprobadas antes de iniciar DB/MockMvc, por `TESTCONTAINERS_PULL_POLICY=org.testcontainers.images.NeverPullPolicy` inexistente. Se autorizó una sola corrección del harness: retirar esa variable y ejecutar la misma suite, sin cambiar código/aserciones; exit0,52/52. Package ya había aprobado y no se repitió.

El verificador T3 observó una sonda extra10casos/1fallo: comparaba la semilla JSON indentada con la serialización compacta después de una activación válida. No fue un defecto reproducido del producto. Sus otras garantías de generación/resultado/contadores pasaron; no reejecutó la revisión. El padre adaptó las regresiones a GET públicos, comparando atributos JSON tras activación válida y bytes/metadatos tras intentos obsoletos, y observó9/9 y68/68 completos. No se presenta esa variante corregida como ejecución del verificador.

### Navegador real y conservación

Chromium existente mediante agent-browser0.39.1, sesión propia `museum-refinement-01a16167`, **cerrada al terminar**. Escritorio1440×1000 y móvil390×844. Solo controles públicos y lecturas DOM; sin inyección de estado Angular, datos simulados ni API mutada para aparentar éxito.

- Sin archivo: pasos futuros deshabilitados. Tras cargar/seleccionar el combinado, clic en pasos y Enter permitieron ir a mapeo/contexto/diagnóstico. Volver a mapeo y regresar conservó selección `catalogNumber`, archivo y diagnóstico27errores+1advertencia.
- Un input por picker; escribir `catalog` filtró a `catalogNumber`, `CatalogNumberNumeric`, `otherCatalogNumbers`; selección por opción aplicada. Texto `rgb(32,58,52)`, opacidad1. Panel estable326px/campo325,66px en escritorio; diferencia menor de1px también en móvil. Controles de edición/sugerencias44,09px de alto; paginación separada.
- Main de escritorio1150×853,22px tanto en mapeo largo como contexto corto; móvil mantuvo altura607,94px entre mapeo y diagnóstico. Documento390px en viewport390px. Footer fuera del área desplazable, sin superposición. Tablas y progreso requieren desplazamiento horizontal interno en móvil; no caben todas las columnas a la vez.
- Publicado Museo+SiB: input y limpieza deshabilitados, un solo campo por selector; diálogo dentro del viewport. Borrador: se escribió valor libre con espacios y se descartó sin guardar. No se afirma una auditoría exhaustiva de accesibilidad ni Escape universal desde cualquier subcontrol.
- Botón «Sincronizar con TDWG»: estado «Sincronizando…» deshabilitado, seguido por éxito real. HAR manual: un POST `/api/catalog/sync` sin cuerpo y un GET del catálogo; estado público posterior con más intentos,414términos/tresfuentes y sin fallo. Nueve perfiles completos iguales antes/después.
- CSV válido y XLSX `Complete`:0errores/0advertencias/0normalizaciones. CSV inválido, combinado y Otros:27errores+1advertencia. Descargas JSON/CSV:28incidencias equivalentes, filas originales. La navegación entre secciones conservó el diagnóstico válido.
- HAR de fase validación CSV y carga del CSV válido: tres GET, sin POST/cuerpos/nombres de esos archivos. No se usa el estado0 del HAR como prueba de HTTP200. XLSX se comprobó funcionalmente; no se afirma una captura HAR nueva de su carga.
- API final: nueve perfiles y tres borradores iguales al baseline completo; los tres ejemplos originales iguales byte a byte a HEAD. Registro de errores del navegador vacío.

Evidencia local (ignorada por Git): [resumen del padre](.browser/refinement-acceptance/parent-summary.json), [HAR manual](.browser/refinement-acceptance/manual-sync.har), [HAR local](.browser/refinement-acceptance/local-analysis.har), [JSON](.browser/refinement-acceptance/diagnostic.json), [CSV](.browser/refinement-acceptance/diagnostic.csv), [XLSX](.browser/refinement-acceptance/xlsx-complete-diagnostic.txt), [perfiles finales](.browser/refinement-acceptance/live-profiles-final.json). Capturas **abiertas e inspeccionadas**: [sincronización](.browser/refinement-acceptance/screenshot-1792726907007.png), [selector escritorio estable](.browser/refinement-acceptance/screenshot-1792727255460.png), [selector móvil](.browser/refinement-acceptance/screenshot-1792727494512.png), [diagnóstico móvil](.browser/refinement-acceptance/screenshot-1792727561747.png), [publicado móvil](.browser/refinement-acceptance/screenshot-1792727698133.png).

Extracto de comandos efectivamente usados; las refs pertenecen al snapshot de ese momento y no son identificadores estables de la aplicación:

```bash
B=/home/dark/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser
S=museum-refinement-01a16167
P=/home/dark/projects/universidad/.browser/refinement-acceptance
"$B" skills get core
"$B" --session "$S" --screenshot-dir "$P" --download-path "$P" --executable-path /home/dark/projects/universidad/.browser/chrome-headless-shell-linux64/chrome-headless-shell open http://localhost:4200
"$B" --session "$S" set viewport 1440 1000
"$B" --session "$S" find role button click --name 'Catálogo Darwin Core' --exact
"$B" --session "$S" network har start
"$B" --session "$S" find role button click --name 'Sincronizar con TDWG' --exact
"$B" --session "$S" network har stop "$P/manual-sync.har"
"$B" --session "$S" upload 'input[type=file]' /home/dark/projects/universidad/examples/records-with-errors.csv
"$B" --session "$S" download @e241 "$P/diagnostic.json"
"$B" --session "$S" set viewport 390 844
"$B" --session "$S" --screenshot-dir "$P" screenshot
"$B" --session "$S" close
```

### Incidentes de automatización actuales

Una evaluación inicial no encontró el panel y falló; se midió después con el selector DOM real y esperando el fin de la animación, sin cambiar producto. Hubo clics de navegación cubiertos por el encabezado del diálogo, una espera de25s agotada tras Escape con foco en un subcontrol y una ref `e10` caducada después de cambiar de sección. No se cuentan como pruebas aprobadas ni como defectos productivos: se utilizó cierre explícito, se confirmó DOM sin diálogo y se navegó con localizador semántico actualizado. El recorrido posterior y la conservación de datos sí fueron comprobados. No se relanzaron agentes ni auditorías por esos incidentes.

No se leyó, movió ni borró la captura externa de la aceptación anterior; tampoco se limpiaron scratches externos de los agentes desde el padre. No se afirma limpieza. Todos los screenshots de este refinamiento usaron `--screenshot-dir` dentro del proyecto.

## Historial: evolución del museo, aceptación integrada

**El recorrido integrado observado funciona con `Museo + SiB` 1.0.** El padre revisó el informe, las capturas internas de escritorio/móvil y los resúmenes; contrastó directamente JSON/CSV, HAR, archivos de origen y GET públicos. Aprobó 28 incidencias equivalentes (27 errores y una advertencia), dos GET sin cuerpos, nueve perfiles y estado TDWG intactos, tres archivos originales sin cambios y ausencia de errores registrados. Las suites y builds finales del padre aprobaron: **6 semillas + 51 backend + 61 frontend = 118 pruebas**. No se modificaron fuentes de producción, perfiles, dependencias ni procesos durante el recorrido de navegador; el cierre documental no agrega una auditoría ni aprobación nativa.

### Evidencia recibida del padre, no ejecutada nuevamente aquí

| Alcance | Resultado y procedencia |
|---|---|
| T1 / S1–S7, S10, S12–S13 | Commit `5b5562e`; 61 pruebas frontend y compilación aprobadas. CRUD real previo conservó los seis perfiles originales y textos arbitrarios; publicación bloqueada y duplicado independiente. |
| T2 / S11 | Commit `043a221`; verificación independiente de JPA aprobada, incluidos rechazos equivalentes y conservación de datos. |
| T3 / S9.1–S9.5 | Commit `56151d9`; verificación independiente finalmente satisfecha. El primer verificador no entregó dictamen; hubo autorización humana para un nuevo intento. El probe adicional falló inicialmente por falta de `@Import(CatalogSyncTests.Fakes.class)` en el harness, no por un defecto productivo. El rechequeo acotado pasó 1/1 con las mismas aserciones. |
| T4 / S8 y conjunto final | Commit `283645d`; job25 del padre terminó correctamente: 6 pruebas de semillas, 51 de API, 61 de frontend, empaquetado Maven y compilación frontend. Advertencia de tamaño: 634,97 kB frente al objetivo de 500 kB; no se alteró el límite. |
| TDWG real | Job27 del padre: 414 términos, tres fuentes oficiales del mismo commit `4b2c4f2dccaf1b3659877feef8d9e61176112fe5`, sin `lastFailure`; ocho perfiles anteriores intactos y nuevo compuesto exacto. Evidencia: [estado](.browser/evolution-live-catalog-status.json) y [nueve perfiles](.browser/evolution-live-profiles.json). |

La API usada por el navegador fue el runtime separado `backend/target/runtime-evolution/museo-evolution.jar`, ya iniciado por el padre en localhost:8080; Angular permaneció en localhost:4200. No se repitieron suites, builds ni auditoría. La sincronización real ya había ocurrido: no se provocó otra descarga TDWG.

### Recorrido ejecutado con navegador público

Se utilizó directamente agent-browser **0.39.1**, con el Chromium existente y la sesión propia `museum-final-20261022-accept`, cerrada al terminar. Escritorio: 1440×1000; móvil: 390×844. Solo se seleccionó el perfil combinado para los análisis. La normalización permaneció desactivada.

| Regla / prueba | Resultado observado |
|---|---|
| S8, S7: perfil combinado | Visible como publicado 1.0, 56 reglas. Diálogo de solo lectura, campos y picker deshabilitados; descripción española con límites de uso y procedencias Museo/SiB conservadas en su idioma original. No se repitió CRUD. |
| Diálogo escritorio/móvil | Capturas revisadas visualmente. En móvil mide 362 px dentro de 390 px; documento sin desbordamiento horizontal. Contenido con `overflow:auto`, desplazable hasta regla 56, cierre visible. Foco inicial en «Cerrar editor»; Tab permaneció dentro del diálogo; Escape lo cerró y devolvió el foco a «Ver reglas». No es una auditoría exhaustiva de accesibilidad. |
| CSV válido | `examples/museum-and-sib-valid.csv`: un registro, 30 columnas, **0 errores / 0 advertencias / 0 normalizaciones**, con Otros. Al probar antes Colección apareció una advertencia por la columna `disposition` ausente, coherente con la regla condicional; no se oculta esa diferencia de contexto. |
| XLSX existente | `examples/records.xlsx` contiene `With errors` y `Complete`; selección real por teclado de `Complete`: un registro, 30 columnas, **cero incidencias** con combinado y Otros. No se regeneró el libro. |
| S5: CSV inválido | `examples/records-with-errors.csv`, combinado y Otros: **28 incidencias = 27 errores + 1 advertencia**, no los 30 del recorrido histórico con dos perfiles. Son 24 incidencias de encabezado y cuatro de celdas: `scientificName` fila 3, `eventDate` fila 2, `decimalLatitude` fila 2 y `decimalLongitude` fila 3. Error con fondo rojizo, borde, mensaje destacado y texto «! Error»; advertencia con indicador propio. |
| Filtros y descargas | Búsqueda `scientificName` + severidad Error dejó una incidencia visible, fila 3. JSON y CSV descargados bajo el prefijo autorizado contienen las **28 incidencias**, iguales campo a campo y en orden, pese al filtro. Claves `field,row,description,severity,profile,version`, enumerados `ERROR/WARNING`, campos técnicos y filas originales intactos. Mensajes nuevos del compuesto en español. |
| Análisis exclusivamente local | HAR iniciado antes de cargar el CSV inválido y detenido después del diagnóstico: **dos GET** a `worker-JB32ZKYB.js?worker_file&type=module`; ningún POST, upload, `postData` ni cuerpo de solicitud. No aparecen nombre de archivo ni valores de celdas en las solicitudes. El HAR registra estado de respuesta 0: prueba el tráfico emitido, no se usa como prueba HTTP200. |
| S2–S4: mapeo | Origen destacado mediante fondo y peso 900; chips separados por 9,1 px. Clic en `Usar catalogNumber` activó `aria-pressed=true`; Limpiar lo retiró; selección `otherCatalogNumbers` desde picker actualizó el chip correspondiente. Duplicar destino desde `unknownField` mostró «Cada campo de destino puede usarse una sola vez.» y bloqueó continuar; se limpió esa asignación para continuar. No se creó fixture adicional. |
| S1, S13: contextos | Las cinco etiquetas coinciden literalmente con S1. Permiso, colección, muestreo y marinos se marcaron simultáneamente; Otros desmarcó los cuatro; marcar colección desmarcó Otros. Se probaron controles públicos, sin inyectar estado ni cambiar el contrato worker. |
| S6: footer | En contenido corto, footer estático en y967–1000, debajo de main que termina en y946. En listado largo (main de 1479,5 px), tras scrollY626, footer y967,28–1000,28, después de main; no superposición. Capturas revisadas también en diagnóstico móvil. |
| S10, S9: catálogo | Categorías con etiquetas, no URI. `Sin categoría` + `current` + búsqueda `associatedMedia` devolvió exactamente ese término; Restablecer volvió a 414. GET del catálogo confirmó 52 categorías vacías, sin inventar clases de reemplazo. Definiciones oficiales inglesas permanecen originales. |
| Navegación y conservación | Navegar a catálogo y perfiles y volver conservó archivo, diagnóstico 27+1 y filtro. GET públicos posteriores al análisis y mapeo coincidieron íntegramente con los nueve perfiles y el estado de catálogo del padre, incluidos hash activo, intentos y fechas. Los tres archivos originales coinciden byte a byte con HEAD. |
| Consola | Sin errores de aplicación ni excepciones de navegador registrados. Solo mensajes de desarrollo Angular/Vite y aviso NG0751 de carga anticipada de bloques diferidos con HMR. |

### Evidencia local y comandos

Los archivos de `.browser/` son evidencia local excluida de Git, no artefactos publicados. Resumen verificable: [probe-summary.json](.browser/evolution-final/probe-summary.json); [HAR](.browser/evolution-final/analysis.har), [JSON](.browser/evolution-final/diagnostic.json), [CSV](.browser/evolution-final/diagnostic.csv), [XLSX](.browser/evolution-final/xlsx-complete.txt), [filtro](.browser/evolution-final/errors-filtered.txt), [navegación](.browser/evolution-final/diagnostic-after-navigation.txt).

Capturas guardadas **y leídas visualmente**:

- [Diálogo escritorio estable](.browser/evolution-final/screenshot-1792703147111.png), [móvil](.browser/evolution-final/screenshot-1792703014528.png), [regla 56 tras scroll](.browser/evolution-final/screenshot-1792703034579.png).
- [Mapeo seleccionado](.browser/evolution-final/screenshot-1792703047278.png), [mapeo móvil](.browser/evolution-final/screenshot-1792702893084.png).
- [Diagnóstico móvil](.browser/evolution-final/screenshot-1792702987577.png), [filtro escritorio](.browser/evolution-final/screenshot-1792702988095.png), [CSV válido](.browser/evolution-final/screenshot-1792702964430.png), [XLSX válido](.browser/evolution-final/screenshot-1792702979995.png).
- [Footer corto](.browser/evolution-final/screenshot-1792703145490.png), [listado largo](.browser/evolution-final/screenshot-1792703145996.png), [diagnóstico/footer](.browser/evolution-final/screenshot-1792703100208.png).

Selección de comandos efectivamente usados, no un script completo de reproducción (variables muestran el ejecutable y sesión exactos; refs corresponden al snapshot de ese momento):

```bash
B=/home/dark/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser
S=museum-final-20261022-accept
"$B" --version
"$B" skills get core
"$B" --session "$S" --executable-path /home/dark/projects/universidad/.browser/chrome-headless-shell-linux64/chrome-headless-shell --download-path /home/dark/projects/universidad/.browser/evolution-final open http://localhost:4200
"$B" --session "$S" snapshot -i
"$B" --session "$S" network har start
"$B" --session "$S" upload 'input[type=file]' /home/dark/projects/universidad/examples/records-with-errors.csv
"$B" --session "$S" find role button click --name 'Validar localmente' --exact
"$B" --session "$S" wait --text 'Descargar JSON'
"$B" --session "$S" network har stop /home/dark/projects/universidad/.browser/evolution-final/analysis.har
"$B" --session "$S" fill @e1552 scientificName
"$B" --session "$S" download @e1547 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.json
"$B" --session "$S" download @e1548 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.csv
"$B" --session "$S" set viewport 390 844
"$B" --session "$S" screenshot --screenshot-dir /home/dark/projects/universidad/.browser/evolution-final --json
"$B" --session "$S" scroll down 29000 --selector .p-dialog-content
"$B" --session "$S" press Escape
"$B" --session "$S" wait --fn '!document.querySelector("[role=dialog]")'
"$B" --session "$S" console
"$B" --session "$S" errors
"$B" --session "$S" close
```

Las interacciones, esperas corregidas, descargas, HAR y cierre terminaron correctamente. El probe Python estándar comparó los GET públicos, exportaciones CSV/JSON y bytes de HEAD; terminó con código 0 y dejó el resumen enlazado. No hay RED significativo para documentación pasiva: se hizo comprobación funcional y lectura estructural, sin afirmar pruebas automatizadas nuevas.

### Incidentes de automatización y límites actuales

- `wait --text 'Diagnóstico de la colección'` agotó 25 s: el título real es «Diagnóstico». Se corrigió la espera a «Descargar JSON»; el diagnóstico ya existía. No fue una avería de análisis.
- Algunos selectores supuestos no existían (`input[type=checkbox][value=other]`, `input[aria-label="Buscar incidencias"]`) o un diálogo todavía estaba animando al intentar navegar. Se usaron snapshots y espera de desaparición del diálogo. El intento final de limpiar búsqueda no se ejecutó: el filtro permaneció activo, declarado en las capturas.
- Intentar continuar con destino duplicado dejó el botón deshabilitado, por lo que una espera posterior de diagnóstico agotó 25 s. Al limpiar **unknownField**, desapareció el conflicto y se completó el análisis. Limpiar solamente catalogNumber no quita su destino implícito original; esto no se presentó como un fallo productivo.
- La CLI aceptó inicialmente rutas posicionales de screenshot pero guardó por defecto fuera del proyecto. Ruta externa conocida reportada por el worker: `/home/dark/.agent-browser/tmp/screenshots/screenshot-1792702857070.png`; podría haber otras capturas iniciales en esa ubicación predeterminada. Se informó al padre, que no leyó, movió ni borró esos archivos. Su limpieza requeriría autorización específica y no se presenta como realizada. El formato corregido `--screenshot-dir` guardó las capturas posteriores dentro del prefijo autorizado. Una captura temprana también tomó el diálogo durante animación: se conservó como evidencia no concluyente y se sustituyó por la captura estable enlazada.
- En móvil, tablas, progreso y navegación usan desplazamiento horizontal interno; se observa recorte de columnas fuera de su viewport, sin desbordamiento horizontal global. No se afirma que todas las columnas quepan simultáneamente en 390 px. No se revalidó cada caso T1, CRUD de perfiles, todos los contextos biológicos ni todas las opciones del catálogo.
- No se atribuye a este navegador la verificación arquitectónica S11/S12 ni toda la sincronización S9: su respaldo está en T1–T4 y en los resultados del padre/independientes descritos arriba. No se reclama aprobación nativa ni auditoría aprobada.

## Historial previo a la evolución

Las secciones siguientes conservan resultados y fallos anteriores; sus conteos y bloqueos no describen el estado integrado actual.

La entrega funcional fue aceptada explícitamente con la auditoría de dependencias pendiente: **«Si acepto.»**. Esa aceptación no transforma un timeout en una auditoría aprobada ni autoriza reintentos. La traducción posterior al español se registra como trabajo adicional, con comprobaciones propias al final de este documento.

No se afirma aprobación de revisión nativa, publicación remota ni despliegue de producción.

## Comprobaciones observadas

| Comprobación | Resultado |
|---|---|
| Datos iniciales sin conexión | 3/3 aprobadas; el RED inicial correspondió a recursos todavía inexistentes |
| API pública sobre PostgreSQL aislado | 20/20 aprobadas antes de traducir; la suite posterior de idioma tiene 21/21 aprobadas; paquete Maven correcto |
| Verificación independiente del backend | Las nueve pruebas originales aprobaron; pruebas HTTP adicionales detectaron dos fallos de validación de entradas |
| Rechequeo acotado de correcciones | 11/11 aprobadas en PostgreSQL nuevo: enumerados numéricos y cuerpos de publicación no vacíos se rechazan sin escrituras; publicación sin cuerpo aprobada |
| Frontend previo a la traducción | 49/49 aprobadas por el padre y el verificador independiente |
| Frontend en español | 56/56 aprobadas por el worker y por el padre; compilación de producción aprobada |
| Tamaño del frontend en español | 633,88 kB iniciales: advertencia sobre el objetivo de 500 kB, por debajo del límite de error sin modificar de 1 MB |
| Coherencia de dependencias tras migración MIT | El verificador confirmó las 21 dependencias directas, sus versiones instaladas/lock y compatibilidad; Angular 21.2.25, build 21.2.27, CDK 21.2.14, PrimeNG 21.1.10, temas 2.0.3, TypeScript 5.9.3 y Vitest 4.1.12 |
| Auditoría de dependencias | No disponible: primer intento agotado a los 120 s; `timeout 300s npm audit --json`, autorizado expresamente, terminó con código 124 a los 5 minutos sin salida. Sin reintento ni afirmación de limpieza |
| Instalación de dependencias | La instalación original agotó 120 s. La migración MIT autorizada terminó correctamente en 21 s con `npm install --no-audit --no-fund` bajo límite de 300 s. `npm ls --all` terminó con código 0. No se ejecutó después un `npm ci` nuevo |
| Evaluación de revisión nativa | No evaluable: el proveedor solicitó declarar los archivos originales restantes sin seguimiento. No se inició una revisión ni se afirmó aprobación o reconocimiento |

Hubo advertencias no fatales de metadatos Maven con respuesta 401, agente dinámico Mockito y API obsoletas. Testcontainers utilizó bases desechables; no se cambió la base existente del proyecto. La base de desarrollo del MVP usa el servicio separado `museum-db` y el puerto 55432. Los archivos locales de entorno no se modificaron.

## Recorridos iniciales en navegador

Se usó Chrome for Testing 156 oficial, descargado con autorización humana en `.browser/`, excluido de Git, y la sesión nombrada `museum-01a16167` de agent-browser.

1. **CSV con errores:** `examples/records-with-errors.csv`, ambos perfiles iniciales publicados y contextos predeterminados. El worker generó 29 errores y una advertencia por columna desconocida. Se conservaron el origen de cada perfil y las filas: `scientificName` vacío en fila 3, `eventDate` inválido en fila 2 y coordenadas fuera de rango en filas 2/3.
2. **Descargas:** los botones JSON y CSV guardaron archivos reales. Ambos contenían 30 incidencias con campo, fila original, descripción, severidad, perfil y versión.
3. **Análisis local:** el registro HAR durante lectura y validación del CSV contiene únicamente dos GET del módulo worker, sin POST ni cuerpo de solicitud. Es evidencia de ese recorrido observado, no una garantía automática sobre cambios futuros.
4. **XLSX:** `examples/records.xlsx` mostró ambas hojas. La hoja `Complete`, elegida mediante teclado, produjo cero incidencias con ambos perfiles. `With errors` produjo el diagnóstico de registros inválidos equivalente al CSV. Los nombres pertenecen a datos de ejemplo y se conservaron.
5. **Perfiles configurables:** se creó mediante la interfaz `Browser acceptance profile` 1.0 con una regla condicional sobre `catalogNumber`; se publicó con confirmación, se duplicó como 1.1 y se editó el borrador. El GET público confirmó que 1.0 seguía publicado con revisión 1 y descripción original; 1.1 era borrador con revisión 1 y nueva descripción. Las reglas eran independientes y equivalentes.
6. **Catálogo:** se comprobaron nombre, URI canónica, definición oficial, categoría y estados vigente/obsoleto.
7. No se observaron errores de navegador en los recorridos CSV/XLSX inspeccionados. Inicialmente se veía un aviso del proveedor por la licencia; no se ocultó ni desactivó, sino que posteriormente se migró a dependencias MIT.

## Fallos registrados y limitaciones

- La prueba de la interfaz principal entregada inicialmente no activaba el contenido diferido. Se reprodujo el fallo y se corrigió su sincronización usando metadatos Query precargados y el estado diferido explícito de Angular. Se conservaron todas las aserciones.
- Una espera de XLSX sin incidencias agotó 30 s porque `select` de agent-browser cambió el valor DOM sin actualizar el campo Angular: `dom=Complete`, `model=With errors`. La selección real con teclado actualizó el modelo y el recorrido corregido aprobó. No se modificó la aplicación para ocultar una deficiencia de automatización.
- Un intento de descarga con un selector textual no admitido por la herramienta no encontró el elemento. La descarga mediante la referencia actual del botón sí guardó el archivo. No fue un fallo de exportación de la aplicación.
- PrimeNG 22 exigía clave y mostraba `Invalid PrimeUI License`. El usuario autorizó migrar. Los archivos de licencia reales de PrimeNG 21.1.10 comunitario y temas 2.0.3 otorgan MIT; se verificaron independientemente las licencias, dependencias y lock. No se inyectaron claves ni se alteró código del proveedor.
- Los formularios basados en señales de Angular 21 son experimentales. Su API compatible conserva el bloqueo de perfiles publicados.
- XLSX se descomprime antes de comprobar los límites de filas/columnas; 10 MiB de archivo comprimido no garantizan un límite equivalente de memoria.
- Keycloak, importación y validación de registros biológicos en backend, y extensión GGBN no están implementados; el MVP debe usarse exclusivamente en localhost.
- La auditoría no produjo resultados dentro de los dos límites descritos. El usuario aceptó esta evidencia no disponible; no se declaró que existieran o no vulnerabilidades.

## Conservación del comportamiento al migrar a MIT

El conjunto compatible está fijado en `package.json` y su lockfile. Query 5.104.5 y `read-excel-file` 9.3.12 no cambiaron. La única adaptación de producción cambió la sintaxis de la función `disabled` de Angular; el predicado de bloqueo y la protección al guardar permanecieron iguales.

Se reprodujo el fallo de metadatos sin resolver de Angular 21 y se agregó `await TestBed.compileComponents()` sin quitar aserciones. El padre y el verificador aprobaron 49/49 pruebas; la compilación de producción fue correcta. El verificador también comprobó el estado deshabilitado en perfiles publicados y habilitado en duplicados, borradores y perfiles nuevos.

En navegador, después de migrar:

- El CSV generó los mismos 30 objetos JSON, **idénticos en contenido y orden** a la descarga anterior.
- La hoja XLSX `Complete` siguió sin incidencias con ambos perfiles.
- Los metadatos y campos de reglas de publicaciones estaban deshabilitados y no había acción de guardado.
- Captura y DOM confirmaron la ausencia del aviso de licencia, sin modificar código del proveedor.

## Traducción al español: evidencia específica

Alcance elegido por el usuario: **«Interfaz, diagnósticos y documentación — recomendado»**. Se mantienen identificadores técnicos, nombres Darwin Core, URI y contratos de API. Los archivos de origen, citas TDWG y contenido arbitrario de los usuarios no se alteran.

### Backend

- RED observado: el título HTTP esperado `Solicitud incorrecta` era `Bad Request`.
- GREEN focalizado: una prueba pública aprobada comprueba títulos y detalles españoles para errores 400/404/409/405, encabezado `Allow` y el listado completo de perfiles sin modificaciones tras rechazos.
- Suite completa: **21 pruebas aprobadas**, cero fallos/errores/omisiones; paquete ejecutable aprobado.
- La traducción usa el tratamiento de excepciones de Spring y conserva encabezados, estado, instancia y claves técnicas. No se cambió la migración Flyway V1 ni los datos publicados.

### Frontend

- El worker observó cuatro fallos esperados al añadir las aserciones de español y luego **56/56 aprobadas**. Se conservan las pruebas anteriores y se comprueban objetos originales intactos, enumerados, claves JSON y publicación sin cuerpo.
- El padre observó **56/56 aprobadas** y compilación correcta. La localización de mensajes iniciales es solo de presentación, acotada a los perfiles oficiales conocidos por identidad y versión; una duplicación conserva los textos originales como datos.
- Chromium comprobó el asistente completo en español: CSV con 29 errores y una advertencia, descargas JSON/CSV de 30 incidencias, y hoja XLSX válida sin incidencias. Las filas, campos, enumerados y claves JSON coinciden con el diagnóstico anterior; solo se tradujeron los textos y la etiqueta del sistema.
- El HAR del análisis español contiene dos GET del worker, sin POST ni cuerpo de solicitud. El GET de perfiles permaneció idéntico tras consultar y analizar: la localización no reescribió las cuatro versiones previas.
- En la interfaz española se creó `Perfil de comprobación en español` 1.0, se editó su descripción, se publicó con confirmación española y se duplicó como 1.1. El GET público confirmó 1.0 publicado/revisión2, 1.1 borrador/revisión0, reglas y textos españoles conservados, identificadores independientes y cuatro perfiles previos intactos. Los campos publicados estaban deshabilitados y no se observaron errores del navegador.
- Los títulos, navegación, paginación, etiquetas de estado/condición/severidad y ayudas se observaron en español. Los nombres de hojas y datos arbitrarios de usuarios permanecen originales. Las cadenas propias del navegador o de controles internos de terceros pueden depender del idioma del entorno y no se alteró código del proveedor.

### Incidente del servidor de desarrollo

Una solicitud de referencia al servidor local antiguo agotó su límite de 5 segundos y se registró como fallo, sin reintentar. El diagnóstico separado encontró PostgreSQL saludable y el proceso Java antiguo todavía escuchando en 8080, pero con `NoClassDefFoundError` de Logback en su registro. Su JAR había permanecido en ejecución mientras se reconstruía el mismo archivo. No se identificó un fallo de traducción ni de base de datos.

El usuario autorizó explícitamente «Sí, actualizar el proceso y completar la comprobación». Se detuvo únicamente el proceso Java local antiguo y se inició la versión española desde `backend/target/runtime-es/museo-es.jar`, una copia distinta del artefacto reconstruible. No se borraron datos ni se ejecutó otra auditoría. La espera acotada de disponibilidad terminó correctamente con GET200; posteriormente la API real devolvió errores400/409/404/405 en español, conservó `Allow` con GET/POST y dejó intactos los perfiles frente a los rechazos. El recorrido español posterior se completó correctamente.

Al reabrir la automatización, la sesión de Chrome había expirado y su lanzamiento sin ruta explícita no encontró un navegador. Se volvió a indicar la ruta ya autorizada de `.browser/chrome-headless-shell-linux64/chrome-headless-shell`, sin descargar otro navegador ni cambiar la aplicación. Las comprobaciones reales siguientes utilizaron ese ejecutable.

Las capturas, descargas y HAR permanecen en `.browser/`, excluido de Git. Los perfiles de aceptación permanecen visibles en la base aislada; no se eliminó historial publicado como limpieza.

## Renombrado del manifiesto Compose

- `docker-compose.yml` pasa a `compose.yml` sin cambios de contenido; `compose.dev.yml` se crea vacío. Se actualizan referencias activas y pruebas de arranque.
- RED observado: el contrato de arranque esperaba `compose.yml` y recibió `docker-compose.yml`.
- GREEN: `python3 -B scripts/test_start.py` (9 pruebas), `bash -n start.sh` y `git diff --check` aprobados. Comparación byte a byte contra el manifiesto anterior y archivo de desarrollo vacío comprobados. Sin arrancar servicios ni leer dotenv reales.
- Evaluación nativa no disponible: requiere declarar los archivos no rastreados; no produjo aprobación.
- Verificación independiente posterior (`gentle-ai-verify`): PASS. Confirmó identidad byte a byte del manifiesto, ausencia de la ruta anterior, `compose.dev.yml` de 0 bytes, referencias activas y equivalencia del arranque salvo el nombre. Ejecutó 9 pruebas aisladas, `bash -n start.sh`, `git diff --check` y tres comprobaciones estructurales, todas aprobadas. Sin despliegue ni aprobación nativa. Informó scratch conservado en `/tmp/compose-verify-YU7z4F`; el padre no lo accedió ni lo retiró por estar fuera del proyecto.


## Co-localización Angular desde dev (2026-11-10)

Worktree propio `refactor/feature-architecture`, base `ebcf020`. No se modificó
el backend ni se incorporó la rama de transporte HttpClient.
- RED estructural: `node scripts/check-architecture.mjs` rechazó `Falta app/app.ts`.
- Primer intento Angular falló con TS5097 por extensiones `.ts` añadidas al
  recalcular imports con sufijos `.preset`/`.config`/`.routes`; corregidos.
- GREEN: checker Node, `npm run lint`, `npm test -- --watch=false` (225 pruebas,
  15 archivos), `npm run build`; comando integrado salió 0.
- Build inicial 649.97 kB: advertencia sobre presupuesto de 500 kB, no resuelta.
- Ambos workers se empaquetaron como módulos separados. Navegador pendiente de
  la unidad de navegación, no se afirma comprobación visual nueva en esta unidad.


## Rutas y servicios por funcionalidad: implementación sin cierre (2026-11-10)

El writer `mwa0gpo1-2-381s` dejó T2 sin commit en el worktree aislado.
Reportó RED de rutas (2 fallos previstos), GREEN focalizado (70 pruebas), checker,
lint, suite (233 pruebas/17 archivos), build y diff-check aprobados. Corrigió un
build inicial superior a 1 MB mediante `loadComponent`; queda advertencia de
658.86 kB frente a 500 kB. Estos resultados son **delegados**, no nuevos checks
observados por el padre. El padre leyó rutas, layout, salida del editor y transporte.

Risk: item 3 — separación de contratos de metadatos compartidos. El assess
pidió verificador independiente; nativeRisk no evaluable por archivos nuevos
sin selección. No se inició revisión nativa ni existe aprobación.

El único verificador `mwa0vany-3-vm8w` falló al preparar aislamiento: su copia
conservó node_modules como enlace al workspace y su política exige dependencias
copiadas sin enlaces. No ejecutó checker, pruebas, lint, build, diff-check ni
comparación diferencial. Su lectura estructural no reemplaza esos checks.
No se lo relanzó ni se intentó reparar su preparación. No se accedió ni limpió
su scratch externo; requiere permiso específico si aún existe.

**Pendiente de decisión humana:** aceptar explícitamente la limitación de prueba
independiente o aportar evidencia independiente. Pendientes también contraste
funcional del padre, navegador real (enlaces profundos, historial, borradores,
importador persistente y escritorio/móvil), revisión nativa aplicable y commit T2.
No se afirma cierre funcional ni visual, ni se publicó o integró el trabajo.


## Contraste del padre tras «Avanza.» (2026-11-10)

El usuario aceptó continuar con la limitación independiente ya explicada. No se
relanzó el verificador ni se sustituyó su aprobación inexistente.

- Comando del padre: `cd frontend && node scripts/check-architecture.mjs && npm run lint && npm test -- --watch=false && npm run build && git diff --check`: salida 0,
  233 pruebas/17 archivos aprobados, build 658.86 kB; persiste warning de 500 kB.
- Diferencial público único contra d694c199b5e89375b0568859555662cb8c33fe55,
  script ignorado `.browser/feature-architecture/metadata-differential.cjs`:
  GET catálogo, POST sincronización sin cuerpo, GET/PUT configuración, señal,
  respuesta, texto arbitrario con espacios, error409 y desconexión idénticos.
  Procesos base/candidato exit0, stderr vacío y stdout idéntico. Adaptador DI
  mínimo en VM para ejecutar métodos reales transpilados; no prueba red real.
- Permiso puntual del usuario para navegador/cache y sesión propia en
  `/home/dark/.cache/ms-playwright` y `/home/dark/.agent-browser`; sin limpieza ajena.
- Chromium con agent-browser, sesión propia `feature-arch-01`, build productivo
  servido en `127.0.0.1:4387` con GET de metadatos ficticios. No se arrancaron
  servicios de la aplicación ni base viva; PUT/POST del servidor de prueba
  deshabilitados. No es evidencia de integración backend.
- Apertura directa `/catalogo` y `/fuentes-de-registros`; raíz y desconocida
  redirigen `/analisis`; títulos y aria-current correctos. Enlaces e historial
  sin cambios pendientes conservaron la sesión y paso del importador.
- CSV ficticio de dos filas leído mediante control público/worker; identificador
  `001` conservado. Mapeo, diagnóstico y preview Normalizar realizados por UI.
  Al visitar catálogo y volver siguieron archivo, paso y preview; `main` ancho
  solo en Normalizar visible. Dos GET API200 y ningún POST/PUT en el tráfico
  registrado: `.browser/feature-architecture/network-requests.txt`.
- Entrada sin agregar y borrador agregado solicitaron confirmación; cancelar
  conservó URL/entrada/lista, aceptar descartó y volver mostró editor limpio.
- Incidente: `agent-browser back` con confirmación abierta hizo agotar el comando
  compuesto a los30s (fallo de automatización registrado, sin reintento ni aumento
  de límite). `dialog status` confirmó diálogo pendiente; `dialog dismiss`
  resolvió la interacción y conservó `/fuentes-de-registros` y `atras-pendiente`.
  No afirmar ejecución limpia del comando Atrás. Historial automatizado Angular
  sí pasó en la suite. No se repitió la maniobra fallida.
- Detalle original de Normalizar abrió por UI; Escape cerró y devolvió foco al
  botón exacto, aria-expanded=false. Capturas abiertas e inspeccionadas en
  `.browser/feature-architecture/screenshots/`: `catalog-desktop.png` (1440×1000),
  `normalization-desktop.png` (1720×1080), `normalization-mobile.png` y
  `sources-mobile.png` (390px). Ancho de documento390px en móvil; navegación
  horizontal contenida, no overflow del documento. No auditoría exhaustiva a11y.
- Sesión de navegador cerrada y servidor propio detenido. No se modificó ni
  limpió ningún caché externo. Revisión nativa pendiente en la siguiente etapa.


### Cierre del refactor por funcionalidades

Commits locales: d694c19 (co-location) y efb0396 (layout/rutas/servicios con pruebas
y evidencia). Se conserva unidad coherente de navegación, mayor que400 líneas;
la estrategia aceptada es cadena sobre rama de trabajo, sin publicar PR.
Assess del rango d694c199b5e89375b0568859555662cb8c33fe55..efb0396 devolvió
nativeRisk=medium, reviewDue=false, reviewDueReason=under_budget. La escalación
item3 conserva la necesidad de verificación independiente, cuya indisponibilidad
aceptó el usuario; no activa una revisión nativa no ofrecida. No se inició
INSPECT/START, no existe nueva aprobación nativa y no se afirma lo contrario.

Las pruebas funcionales y de navegador quedaron observadas por el padre con los
límites anteriores. Backend/Testcontainers/Compose no se ejecutaron porque no
se modificaron. Auditoría npm no repetida. No se publicó ni integró nada.


## Ajuste solicitado: App directamente en src/app (2026-11-10)

Usuario: «Cierralo pero antes los archivos de app/app dentro del front dejalos en
app/, luego de esto has los commits y el pr a dev.» Se movieron app.ts/html/scss,
app.spec.ts y routes.spec.ts a `frontend/src/app/`; imports, checker y documento
arquitectónico adaptados. La raíz App es la excepción explícitamente solicitada;
los componentes de funcionalidades conservan sus carpetas propias.

- RED checker: `Falta app.ts`; GREEN tras mover los archivos, con prohibición del
  antiguo subdirectorio redundante. `npm run lint` aprobado.
- `npm test -- --watch=false`: **falló**, 231 aprobadas y dos timeouts de5000ms:
  `routes.spec.ts` → abre catálogo directamente y conserva la instancia de análisis;
  `layouts/museum-layout/museum-layout.spec.ts` → carga/error/reintento de metadatos.
  No se repitió, no se subieron límites ni se modificaron aserciones para ocultarlo.
  No se puede declarar suite verde ni reemplazarla por las233 pruebas históricas.
- Build omitido por el && anterior; ejecutado como comprobación distinta mediante
  `npm run build && git diff --check`, salida0. Warning bundle658.86kB/500kB persiste.
- No navegador nuevo: esta unidad solo reubica archivos/imports, sin cambios de UI.
  Verificación independiente previa sigue indisponible; no se relanzó.
- Usuario eligió expresamente «No crear issue; dejar el PR pendiente». No se creó
  issue aprobado ni se hizo push/PR. Commits locales autorizados, con los fallos
  anteriores visibles. No se aprobó ni integró nada.

**Needs your decision:** falta autorización para una nueva ejecución de la suite
(o evidencia externa equivalente) que resuelva los dos timeouts. PR pendiente por
la decisión explícita del usuario y ausencia de issue aprobado requerido por el
flujo de PR del entorno; no es una protección GitHub comprobada.


### Cierre de seguimiento por aceptación manual del usuario

Usuario: «Cierra la verificacion, ya lo mire yo en persona y funciona.»
Se acepta su comprobación personal como disposición para detener el seguimiento,
no como sustituto de pruebas automatizadas o de verificación técnica independiente.
No se repiten suites ni navegador. Se conserva el resultado observado de la última
suite:231 aprobadas y dos timeouts de5000ms; checker, lint y build aprobados.
La verificación independiente anterior sigue sin resultado. No afirmar suite verde
ni aprobación independiente/nativa. T4 se retira del seguimiento sin marcarla como
pruebas aprobadas. El PR permanece pendiente por la decisión explícita anterior
«No crear issue; dejar el PR pendiente». Este cierre no publica ni integra nada.
