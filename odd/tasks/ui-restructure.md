# Reestructuración visual y columnas independientes

Objetivo: corregir la interfaz rota en el entorno Docker, reestructurar cada apartado para escritorio y mejorar el redimensionado de columnas. Rama: feat/collections-management (sin commits hasta autorización). Pruebas: Vitest (`npm test -- --watch=false`), navegador real sobre `universidad-dev` (datos de desarrollo, autorizado por el usuario).

## Specs

- S1. Entorno: "ya tienes el servicio arriba este servicio es de desarrollo y no contiene datos reales asi qeu lo puedes usar apra pruebas". Tailwind debe generarse en la imagen Docker de desarrollo y en el build de producción (hoy falta `.postcssrc.json` en `.dockerignore` y en los montajes de `compose.dev.yml`).
- S2. Verificación visual real: "quiero que vuelva a verificar como se ve la interfaz, esta horrible no se entiende nada y para escritorio todo se ve pegado y no se entiende nada." Recorrer cada apartado en escritorio (y móvil) contra el servicio de desarrollo.
- S3. "intenta ver cada apartado de la interfaz y re estructura y cambia todo y optimiza." Aplicar impeccable, ui-ux-pro-max y frontend-design (modo Operate: jerarquía, espaciado, densidad legible).
- S4. "Mejora el mecanismos de reajustar el tamaño de las columas de las tablas y por ejemplo que cada columna tenga su tamaño independiente."
- S5. "agrega que por ejemplo se puedan escoger emogis de animales para diferencias aparte de textualmente un poco visual las colecciones, y as que el underline no sea el unico lugar donde se pueda dar click para entrar a la interfaz [...] El cambio del emoji debe ser dentro de la cclecicion y debe verse aca afuera y adentro." Decisión del usuario: persistir en backend (campo aditivo, migración V6, revisión/bloqueo).

## Tasks

- T1 [S1] inline — corregir `.dockerignore`/`compose.dev.yml`, recrear frontend dev y comprobar utilidades — hecho (RED real `!.postcssrc.json` ausente → GREEN 15/15 Compose; `.workspace` display flex en universidad-dev)
- T2 [S2,S3] inline — auditoría visual por apartado y reestructuración — en curso
- T3 [S4] inline — columnas con ancho independiente — en curso (ancho por contenido + doble clic ajusta; sin persistencia por contrato vigente)
- T4 [S1–S4] inline — suite, build, Compose tests, navegador y evidencia — en curso (406/406 serie, lint, Compose 15/15; build pendiente)
- T5 [S5] inline — fila pulsable y emoji de animal por colección (backend V6 + endpoint + frontend) — hecho: backend 18/18 + migración 2/2, frontend 62/62, navegador 🦋 revisión 2→3 en cabecera e índice; Risk: item 1 (migración aditiva V6) y 4 (revisión/bloqueo); verificador independiente pendiente

## Log

- L1 (2026-11-26, usuario, literal): "Creo que trabjaste a ciegas, vamos a ver, ya tienes el servicio arriba este servicio es de desarrollo y no contiene datos reales asi qeu lo puedes usar apra pruebas y quiero que vuelva a verificar como se ve la interfaz, esta horrible no se entiende nada y para escritorio todo se ve pegado y no se entiende nada. Con los contenedores de desarrollo arriba, intenta ver cada apartado de la interfaz y re estructura y cambia todo y optimiza. Mejora el mecanismos de reajustar el tamaño de las columas de las tablas y por ejemplo que cada columna tenga su tamaño independiente. Usa las skills de diseño ui-ux, impeccable y frontend desing."
- L2. Causa raíz observada en `universidad-dev-frontend-1`: `/app/.postcssrc.json` ausente → Tailwind no genera utilidades → shell, listas y barras sin distribución (captura `.browser/ui-restructure/before/collections.png`). Las pruebas locales pasaban porque el host sí tiene el archivo.
- L3. T3: el mecanismo ya guardaba anchos por clave (teclado: solo cambia la columna tocada), pero todas nacían iguales (192px) y el doble clic restablecía. Se añadió `resizeAutoFit` (ancho por contenido visible) y doble clic = ajustar al contenido. Se retiró la persistencia en localStorage: contradice el contrato documentado («nada de localStorage») y no fue pedida; se ofrece aparte.
- L4. Incidente de entorno: `universidad-dev-backend-1` terminó con 137 (memoria) durante pruebas; se reinició con `docker start` y quedó healthy. Trabajo backend paralelo ajeno (commits b98e7b9/46f0052, provenance.json) no se tocó.
- L5 (2026-11-26, usuario, literal): "Algo que no me gusta es esta interfaz, agrega que por ejemplo se puedan escoger emogis de animales para diferencias aparte de textualmente un poco visual las colecciones, y as que el underline no sea el unico lugar donde se pueda dar click para entrar a la interfaz, carga las skills de siempre para verificar que todo este bien. El cambio del emoji debe ser dentro de la cclecicion y debe verse aca afuera y adentro." Respuesta a pregunta: «Backend (Recomendado)».
- L6 (2026-11-26, usuario, literal): "No yo me encargo, ahora quiero que rapidamente implemente pantallas como de notfound y de errores, claramente utiliza layout y un codigo reutilizable". Hecho: StatusPage reutilizable, NotFoundPage (`**`) y ErrorPage (`/error`) dentro del layout, manejo de errores de navegación. Rutas: pruebas nuevas 2/2; el verificador independiente de la migración queda a cargo del usuario.
