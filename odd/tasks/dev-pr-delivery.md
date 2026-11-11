# Entrega de ramas a dev
Repositorio: `github.com/darwinlatorre/museum-dwc-prototype`; destino final `dev`, sin merge automático.
Estrategia: `feature-branch-chain`, tracker borrador y tres cortes; pruebas Python aisladas por frontera y evidencia Angular/Nginx existente.

## Specs

- S1: «Vale necesito que ahora verifiques los cambios de las distintas ramas y hagas los pr a dev.» — comprobar las fronteras y publicar PR sin fusionar ni aprobar.
- S2: «Cadena con rama integradora — recomendada» — elección humana: tracker borrador a dev y PR dependientes hacia sus predecesores.
- S3: «Crear issue y autorizar status:approved» — crear una issue de entrega con esa etiqueta exacta; PR con `Refs`, sin cierre automático.
- S4: «No tiene secretos ya esta comprobado.» — declaración humana sobre `.env.example`; conservar el commit humano y su atribución. No leer plantilla ni dotenv reales.

## Tasks

- T1 [S1–S4] Inventario y autoridad de destino; ruta padre; estado done; origin y base dev comprobados, actor ADMIN, sin PR/issues abiertas; sin commit.
- T2 [S1–S2] Materializar fronteras sin reescribir ramas ni perder cambios; ruta padre; estado done; tracker 5d2c0ab, plantilla 810b74d, retiro 0d37607; árbol frontend preparado sin commit.
- T3 [S1–S2] Verificar cada corte y conservar evidencia de límites; ruta verify + padre; estado blocked; retiro 12/12 PASS; frontend 14/14/lint/build PASS, Angular nuevo timeout240s sin resultados; espera decisión humana, sin reintentos.
- T4 [S1–S4] Crear issue, publicar ramas y abrir tracker/PR; ruta padre; estado in_progress; issue #17 confirmada; solo tracker/plantilla/retiro publicables, frontend retenido por T3.
- T5 [S1–S4] Readback remoto, registrar enlaces y estado de checks; ruta padre; estado pending; sin merge/push forzado.

## Log

- L1: Pedido original: «Vale necesito que ahora verifiques los cambios de las distintas ramas y hagas los pr a dev.».
- L2: Destino identificado sin ambigüedad: origin `https://github.com/darwinlatorre/museum-dwc-prototype.git`. Default remoto main; humano seleccionó explícitamente dev. Se usará dev, nunca main. Cuenta autenticada tiene ADMIN; autorización humana específica para crear issue y aplicar `status:approved`. Etiquetas `type:chore`, `type:feature`, `type:docs` disponibles. No se atribuye protección de ramas configurada.
- L3: Inventario inicial: dev y feat/same-origin-api en 4b440f4; chore/remove-traefik en a708bcb (+1/-6 exclusivamente .env.example según metadatos). La implementación está sin commit en working tree. No leer contenido dotenv; declaración humana S4 registrada, no revisión propia de secretos. `.gitignore` contiene cambio concurrente ajeno y queda fuera; `.playwright/` y scratch tampoco se publican.
- L4: Un corte honesto: tracker documental; hijo1 reutiliza el cambio humano de plantilla; hijo2 aplica siete snapshots `.browser/same-origin-api/before/` (retiro Traefik completo); hijo3 contiene proxy + hostname único, con pruebas/docs como una unidad frontend. No separar artificialmente environments del proxy. El último corte puede superar 400 líneas incluyendo evidencia: mantener cohesión, no recortar pruebas ni falsear tamaño. Se medirán adiciones+eliminaciones exactas.
- L5: Para mantener genealogía real sin rebase/reset/merge ni alterar las ramas originales, se materializarán nuevas ramas de revisión en worktrees registrados: `feat/runtime-delivery` → `chore/review-env-template` → `chore/review-remove-traefik` → `feat/review-frontend-access`. El commit humano a708bcb se traslada con cherry-pick -x, sin editar ni mostrar la plantilla. El root y sus cambios permanecen intactos. Etiquetas y PR operan solo en repositorio autorizado.
- L6: Evidencia previa reusable, no nueva: root final 14/14 Python + independiente 14/14, Angular249/lint/build, Nginx79 aserciones; navegador proxy propio no ejecutado por OOM y aceptación manual humana registrada. Revisar checkpoint retiro con12 pruebas y final con14 desde sus árboles exactos. Auditoría npm pendiente aceptada, no repetir. Riesgo item5 (entorno); hostname item2. No prometer aprobación nativa ni checks verdes remotos no observados.

- L7: Issue aprobada creada y releída: https://github.com/darwinlatorre/museum-dwc-prototype/issues/17, etiquetas status:approved/type:chore; cuerpo idéntico tras readback. Issues habilitadas, blank permitido y sin formularios; búsqueda de duplicados abierta/cerrada sin resultados.

- L8: Worktrees registrados y genealogía lineal real, sin modificar ramas originales: tracker5d2c0ab → plantilla810b74d (cherry-pick -x a708bcb) → retiro0d37607. Corte retiro341 líneas, siete archivos. El corte frontend preparado mide354 líneas con CJS, excluyendo seguimiento ODD que se mantiene en tracker; no se reducen pruebas ni docs funcionales.
- L9: Independiente mwbdnesx-f-nygg: retiro12/12 PASS7,499s,16 modelos/diferenciales conformes, inputs intactos; padre contraste1/1 PASS0,222s. ASSESS comprometido de retiro: nativeRiskmedium,reviewDuefalseunder_budget; escalamientoitem5 requiere independiente y está satisfecho, sin aprobación nativa.
- L10: Independiente mwbdsckq-g-a58l del frontend:14/14 PASS16,957s,lint/build PASS; Angular quedó en RUN sin resultados y agotó240s. Timeout registrado como fallo, no se reintenta ni se amplían límites. Nginx/Dockerfile/CJS byte-idénticos a raíz ya verificada (79 aserciones reutilizadas, no nuevas). No hay procesos de test restantes ni subagentes activos. Sin defecto de código demostrado. Se retiene el último PR y su commit; publicar solo cortes seguros no equivale a cierre de la arquitectura.
