# Responsabilidades y empaquetado del backend
Objetivo: hacer explícitas las capas hexagonales por funcionalidad, sin alterar los contratos HTTP actuales.
Rama: refactor/backend-layer-responsibilities; entrega: auto-chain / feature-branch-chain, sin publicación autorizada; comprobaciones: Python de arquitectura, Maven + Testcontainers.

## Specs
- S1: «Revisa que la delegacion de responsabilidades del backend entre capas este bien.» «Los controllers esta manejadno logica de servicio, como por ejemplo mapear, esto deberia encargarse el servicio.»
- S2: «Los mapers van en la capa de infraestructura»
- S3: «No veo que se lleve una capa de domain-application-infraestructure, mejora el empaquetado, porque veo que configuracione sta por fuera y no esta llamado como ***BeanConfig.java»
- S4: «Distingue el uso de los mapper y los builder(Implementalos)»
- S5: «Has que todo dato apartir de la entrada entre como req, y de salida salga como res.» Decisión del usuario: «Preservar contratos actuales (recomendado)»; DTO req/res para cuerpos de negocio, conservando JSON publicado, ProblemDetail, parámetros de ruta y operaciones sin cuerpo.
- S6: «Empaqueta asi solo haya un solo archivo, pero que quede bien explicito, por ejemplo:»
```text
├── domain/
│   ├── model/
│   │   └── Usuario.java
│   └── exception/
│       └── UsuarioNoEncontradoException.java
│
├── application/
│   ├── port/
│   │   ├── in/
│   │   │   └── CrearUsuarioUseCase.java (Interfaz)
│   │   └── out/
│   │       └── UsuarioRepositoryPort.java (Interfaz)
│   └── service/
│       └── CrearUsuarioService.java (Implementa la interfaz 'in')
│
└── infrastructure/
    ├── adapter/
    │   ├── in/
    │   │   └── web/
    │   │       ├── UsuarioController.java
    │   │       └── dto/
    │   │           └── CrearUsuarioRequest.java
    │   └── out/
    │       └── database/
    │           ├── UsuarioJpaRepository.java
    │           ├── UsuarioDatabaseAdapter.java (Implementa 'out')
    │           └── entity/
    │               └── UsuarioEntity.java
    └── config/
        └── UsuarioBeanConfig.java
```
- S7: «Ten en cuenta muy bien las skill de java y spring.»

## Tasks
- T1 [S1–S7] done; route: catálogo inline y perfil delegado por backstop posterior; 8 pruebas focalizadas PASS, núcleos compilados y empaquetado real comprobado; commits: perfiles a6bd16e; catálogo 3b99fb1.
- T2 [S2,S3,S5,S6,S7] done; route: checker inline y documentación delegada por backstop; 10 regresiones RED→GREEN, checker real, contraste documental y diffcheck PASS; commits: docs por funcionalidad a6bd16e/3b99fb1, transversal a627c56.
- T3 [S1–S7] done; route: comprobaciones integradas inline y verificador independiente por riesgo item 4; 171 pruebas+package, diferencial 50/50 y verificación independiente PASS; evidencia registrada en a627c56; ASSESS no evaluable, sin continuación ni aprobación nativa; sin push/PR.

## Log
### L1 — Pedido original
Revisa que la delegacion de responsabilidades del backend entre capas este bien.
Observaciones que veo:
1. Los controllers esta manejadno logica de servicio, como por ejemplo mapear, esto deberia encargarse el servicio.
2. Los mapers van en la capa de infraestructura
3. No veo que se lleve una capa de domain-application-infraestructure, mejora el empaquetado, porque veo que configuracione sta por fuera y no esta llamado como ***BeanConfig.java
4. Distingue el uso de los mapper y los builder(Implementalos)
5. Has que todo dato apartir de la entrada entre como req, y de salida salga como res.
6. Empaqueta asi solo haya un solo archivo, pero que quede bien explicito, por ejemplo:

├── domain/
│   ├── model/
│   │   └── Usuario.java
│   └── exception/
│       └── UsuarioNoEncontradoException.java
│
├── application/
│   ├── port/
│   │   ├── in/
│   │   │   └── CrearUsuarioUseCase.java (Interfaz)
│   │   └── out/
│   │       └── UsuarioRepositoryPort.java (Interfaz)
│   └── service/
│       └── CrearUsuarioService.java (Implementa la interfaz 'in')
│
└── infrastructure/
    ├── adapter/
    │   ├── in/
    │   │   └── web/
    │   │       ├── UsuarioController.java
    │   │       └── dto/
    │   │           └── CrearUsuarioRequest.java
    │   └── out/
    │       └── database/
    │           ├── UsuarioJpaRepository.java
    │           ├── UsuarioDatabaseAdapter.java (Implementa 'out')
    │           └── entity/
    │               └── UsuarioEntity.java
    └── config/
        └── UsuarioBeanConfig.java

Ten en cuenta muy bien las skill de java y spring.

### L2 — Exploración y decisiones
La exploración no encontró negocio en controllers: delegan y manejan transporte. El mapper HTTP pertenece a infraestructura, no al servicio Java puro. Se usará un servicio/fachada web si hace falta para sacar la coordinación de conversiones del controller sin filtrar DTO al núcleo. Se preservan contratos y fronteras transaccionales. El usuario eligió «Preservar contratos actuales (recomendado)» y «Cadena sobre rama de refactorización (recomendado)».
Estimación: más de 400 líneas (movimientos mecánicos separados de cambios semánticos por funcionalidad); cortes profile, catalog e integración. No hay autorización de push/PR. Base: af5edab. Cambios humanos ajenos: frontend/angular.json y .env.example; no leer ni stagear dotenv.
Prueba primero: RED estructural del nuevo empaquetado antes de mover clases; nuevas pruebas focalizadas para builders/mappers y regresiones HTTP; no se cambia comportamiento de negocio. Maven se ejecutará centralizado para evitar carreras en target/ y presión de Testcontainers.
### L3 — Incidente de delegación y RED
El runtime rechazó ambos writers alegando ausencia de Spec/Tarea aunque el documento ya existía; no se reintentó y se continuó inline según su instrucción. No hubo modificaciones de los children. La sonda estructural inicial terminó exit 1: faltaban los diez paquetes esperados. Se lanzó ProfileContractTests sobre la base antes de cambiar Java para capturar el contrato diferencial público.
### L4 — Implementación y reanudación
El backstop de contexto admitió después un worker acotado para perfil, con superficies disjuntas respecto del catálogo inline. Al retomar por «Retomam», el runtime ya no reconocía su task ID: no se relanzó ni se atribuyó un informe inexistente; se contrastaron los archivos y se ejecutaron comprobaciones nuevas del padre.
Baseline: ProfileContractTests exit 0, 50 observaciones públicas en salida del job original. Catálogo: núcleo javac PASS. Checker: 10 fallos iniciales exit 1, luego 10/10 PASS exit 0, checker sobre árbol real y git diff --check PASS.
Se archivaron exclusivamente target/classes y target/test-classes en .browser/backend-layers/pre-refactor-* para evitar clases antiguas duplicadas; no se borraron JAR ni se tocó la ejecución viva. Maven focalizado exit 0: 8 pruebas nuevas, 0 fallos/errores/omisiones (builder, mapper HTTP/perfiles, mapper persistencia/perfiles y mapper HTTP/catálogo). Suite completa y package lanzados, todavía pendientes.
ASSESS no evaluable por archivos untracked; escalado item 4 por reubicación de composición transaccional/JPA. Verificador independiente de solo lectura lanzado, sin Maven compartido. Sin aprobación nativa, commits ni publicación todavía.
### L5 — Comprobaciones integradas observadas
Maven test + package -DskipTests exit 0: 171 pruebas en 13 clases con fuente vigente, 0 fallos/errores/omisiones; 8 focalizadas son subconjunto, no se suman. Verificador independiente: sin bloqueadores por S1–S7, checker10/10, javac y 65 casos puros; sin Maven compartido.
La lectura del log temporal original falló FileNotFoundError tras reanudar: no era un fallo del producto. Por «retoma.» se reconstruyó af5edab en .browser/backend-layers/baseline-af5edab, exclusivamente pom/mvnw/.mvn/src/scripts (sin dotenv), con PostgreSQL desechable. ProfileContractTests baseline exit 0. Se recuperaron las 50 observaciones actuales del XML Surefire existente sin repetir la suite actual. Comparación exit 0: 50/50 idénticas en estado, cuerpo exacto y headers; evidencias durables en .browser/backend-layers/{baseline-contract.stdout,baseline-contract.stderr,baseline-contract.exit,current-contract.json,http-contract-comparison.json,suite-summary.json}.
Worker documental acotado completó T2 por backstop; lectura del padre y git diff --check confirmaron la actualización de los cuatro documentos sin cambios Java adicionales. Siguen pendientes commits y evaluación/revisión nativa de cada unidad aplicable; no hay publicación autorizada.
### L6 — Cortes de revisión y evaluación
Corte 1: af5edab..a6bd16e, perfiles + handler HTTP compartido + sus pruebas/documentación, 727 líneas añadidas/eliminadas con renames. Es la menor unidad funcional coherente: separar movimientos del mapper/builder dejaría referencias rotas o separaría pruebas del comportamiento. Se conserva el corte completo, sin reducir claridad ni cobertura para ajustar el presupuesto orientativo. Estrategia elegida: auto-chain / feature-branch-chain; referencias locales de cortes, sin push/PR. La rama parte de af5edab (trabajo de entorno previo heredado), no se confunde su diff desde main con el alcance actual.
ASSESS del corte 1 committedOnly contra af5edab siguió no evaluable por untracked, aun con rango explícito; escalado item 4. La autoverificación y el verificador independiente ya aprobaron. No devolvió reviewDue ni continuación nativa; no se inventa START ni aprobación. Revisión nativa no disponible para esta evaluación, sin cambiar el switch.
Corte 2: a6bd16e..3b99fb1, catálogo con mappers/DTO, persistencia y pruebas/documentación; 755 líneas añadidas/eliminadas con renames. Misma justificación de coherencia para los movimientos. ASSESS del rango committedOnly vuelve no evaluable por untracked, con escalado item 4; sin reviewDue/continuación ni aprobación.
Corte 3: 3b99fb1..a627c56, checker y documentación transversal, 148 líneas añadidas/eliminadas. ASSESS committedOnly no evaluable por untracked, sin reviewDue ni continuación; plan de autoverificación satisfecho, sin nueva ronda independiente. Las referencias locales de cortes permiten preparar la cadena futura sin publicar. Los cortes de paquetes deben aplicarse en orden y el checker estricto de la nueva estructura se incorpora en el último corte; la aceptación integrada corresponde al árbol final, no se atribuye ejecución individual a cada commit.
### L7 — Cierre
S1–S7 comprobados; no hay tareas funcionales abiertas. El único resultado no disponible es la evaluación/revisión nativa, no se declara aprobada ni se cambia RDD. Verificación funcional, contraste público y verificación independiente completos; sin navegador/auditoría nuevos porque no se modificó la interfaz ni se pidió auditoría. Cambios humanos de frontend/angular.json y .env.example intactos. No se eliminaron scratches externos ni se accedió a datos vivos o dotenv. Riesgo: item 4, composición transaccional y persistencia concurrente; cubierto con pruebas reales de PostgreSQL y verificación independiente. El primer diff-check del documento ODD rechazó un espacio final del pedido copiado (exit 2); se retiró únicamente ese espacio de formato antes de repetir la comprobación. El commit documental final conserva esta especificación y los cortes locales, sin publicación.
