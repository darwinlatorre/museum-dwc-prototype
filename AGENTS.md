# Instrucciones para agentes

## Proyecto y referencias

Módulo del Museo de Historia Natural de la Universidad del Cauca: Angular/PrimeNG, Spring Boot con Spring Data JPA y PostgreSQL. Es un MVP local, no un despliegue de producción.

- `README.md`: ejecución, alcance y restricciones.
- `frontend/README.md` y `backend/README.md`: arquitectura y contratos.
- `sources/README.md`: fuentes oficiales y atribuciones.
- `VERIFICATION.md`: evidencia observada, historial y limitaciones.
- `odd/tasks/`: especificaciones, decisiones y tareas. La evolución `museum-evolution.md` tiene T1–T5 completadas; el refinamiento Java/UX está en `museum-refinement.md`. No reabrir trabajo anterior sin una nueva necesidad.

## Invariantes

- Analizar CSV/XLSX exclusivamente en el navegador mediante Web Workers. No enviar archivos, nombres, celdas ni registros biológicos al servidor.
- Preservar datos originales, textos arbitrarios, espacios y versiones publicadas. Modificar reglas publicadas mediante una nueva versión.
- Mantener claves/enumerados de API, identificadores y URI oficiales; interfaz y documentación en español. No traducir citas oficiales ni contenido del usuario automáticamente.
- Usar únicamente TDWG como autoridad del vocabulario. SiB aporta requisitos de perfiles, no términos inventados. Conservar categorías ausentes y la última instantánea válida ante fallos.
- Conservar bloqueos, control de revisión e inmutabilidad en PostgreSQL. Acceso productivo mediante entidades y repositorios JPA; migraciones aditivas.
- No leer ni modificar `.env`, ni modificar los archivos iniciales ajenos `.env.example` y `docker-compose.yml`. Utilizar `compose.mvp.yml` para la base aislada, sin cargar archivos de entorno.
- Mantener servicios en localhost. Autenticación e importación biológica al servidor son trabajo futuro, no funcionalidades existentes.
- Separar DTO de entrada/salida en `profile/dto/req` y `profile/dto/res`; mantener el modelo y servicio independientes del transporte. Usar getters JavaBean en entidades y excepciones propias en `shared/exceptions`.
- Mantener las pruebas de perfiles en su paquete `profile`, con JPA/EntityManager y PostgreSQL desechable; no sustituirlas por mocks que eliminen cobertura de trigger o concurrencia.
- Reutilizar el selector DwC compartido de una sola entrada y sus contratos de valor, limpieza y deshabilitación; preservar el workbench montado y las guardas de navegación/generación.
- La sincronización manual y la programada comparten la misma maquinaria. Evaluar `SUCCESS`/`FAILED`/`SUPERSEDED`, no solo HTTP200; los intentos viejos nunca reemplazan activaciones ni fallos nuevos.
- No sobrescribir un JAR en ejecución: ejecutar una copia separada del artefacto de compilación.
- No publicar cambios ni crear PR por iniciativa propia: el alcance actual es local.

## Comprobaciones

Desde la raíz:

```bash
python3 scripts/test_seeds.py
(cd frontend && npm test -- --watch=false && npm run build)
(cd backend && bash ./mvnw test && bash ./mvnw package -DskipTests)
git diff --check
```

Las pruebas backend requieren Docker y crean PostgreSQL desechable mediante Testcontainers; no usan la base viva del MVP. La ejecución manual de la aplicación usa la base aislada indicada en `README.md`. No sustituir ninguna por la base original. Para documentación pasiva, usar comprobaciones estructurales proporcionales; no repetir suites innecesariamente.

## Verificación de navegador

- Utilizar un navegador real con agent-browser y una sesión propia. Interactuar mediante controles públicos; no inyectar estado para simular que una funcionalidad funciona.
- Comprobar resultados observables: acciones, mensajes, selección, navegación, foco, Escape, desplazamiento y geometría en escritorio/móvil. Abrir e inspeccionar las capturas, no solo generarlas. Esperar el estado observable final de overlays/animaciones antes de medir o navegar; actualizar refs tras cambiar de sección y usar cierre explícito cuando corresponda.
- Contrastar descargas JSON/CSV, HAR y GET públicos antes/después cuando corresponda. Distinguir tráfico emitido de una respuesta HTTP exitosa.
- Guardar capturas y descargas dentro de `.browser/`; configurar `--screenshot-dir` explícitamente. Cerrar la sesión propia al terminar.
- Obtener autorización específica antes de acceder fuera del proyecto. Un permiso histórico para un caché no autoriza otra sesión ni limpiar archivos externos.
- Registrar comandos, resultados, incidentes y límites en `VERIFICATION.md`. Un error de automatización no demuestra un defecto del producto; un informe delegado no reemplaza su contraste.

## Estado y comunicación

- Responder en español con el detalle adecuado a cada pedido. Separar trabajo pendiente, limitaciones aceptadas y funcionalidades futuras.
- La auditoría npm agotó el tiempo autorizado y quedó pendiente con aceptación humana: no repetirla ni afirmar que aprobó.
- La revisión nativa no produjo aprobación. La advertencia de tamaño del bundle y la captura accidental externa están documentadas; no inventar su resolución.
- No confundir la evidencia histórica con pruebas nuevas. La evolución anterior registró118pruebas; el refinamiento Java/UX comprobó145(68backend,71frontend,6semillas), con aceptación integrada. No implica una auditoría exhaustiva de seguridad o accesibilidad.
