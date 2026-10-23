# Frontend organizado por funcionalidad

El árbol de `src/app` expresa los tres dominios visibles: catálogo Darwin Core,
perfiles de validación y análisis local de colecciones. Los movimientos conservan
los componentes, controles, señales y contratos existentes; no añaden capas de estado.

## Comprobación rápida

Desde la raíz del repositorio:

```bash
cd frontend && node scripts/check-architecture.mjs
```

El comprobador usa solo Node: exige las ubicaciones principales, resuelve imports
relativos y recursos de componentes, verifica la URL del worker y detecta contratos
duplicados. Impide dependencias de vistas desde `core`/`shared` y desde el motor.
No sustituye las pruebas Angular, el build ni la comprobación en navegador.

## Propietarios y límites

| Ubicación | Responsabilidad |
| --- | --- |
| `features/catalog` | `Catalog`, su HTML y el contrato `Term` en `models/catalog-term.ts`. |
| `features/profiles` | `Profiles`, su HTML y `Profile`, `ProfileInput`, `Rule`, `Condition` en `models/profile.ts`. |
| `features/importer/workbench` | Orquestación del análisis y HTML; conserva `map`, invalidación, cancelación y guardas de generación/navegación. |
| `features/importer/components` | Componentes existentes `column-mapping` y `record-context`, cada uno en su carpeta; sin envoltorios nuevos. |
| `features/importer/engine` | Parser CSV/XLSX, normalizador, validador, exportación y `analysis.worker`; pruebas del motor colocadas aquí. |
| `features/importer/models` | `dataset` y límites, `context`, `analysis-result`, `normalization` y `worker-protocol`. |
| `core/api` | `Api`: transporte exclusivamente de metadatos; conserva fetch, AbortSignal, revisiones y POST sin cuerpo. No recibe archivos ni registros biológicos. |
| `core/i18n` | Etiquetas y presentación localizada; conserva citas oficiales y texto arbitrario del usuario. |
| `shared/ui/dwc-picker` | Selector reutilizable de una entrada; conserva valor libre, limpieza y deshabilitación con Signal Forms. |
| `testing` | Pruebas de composición, estilos y cruces entre funcionalidades; las pruebas propias permanecen junto al propietario. |

`App` sigue siendo la composición raíz: navegación, vistas diferidas, workbench
montado y coordinación de consultas/caché. No es un repositorio ni un motor de análisis.

Las dependencias entre funcionalidades apuntan a contratos con `import type`, no a
sus vistas. `core` y `shared` pueden consumir esos modelos, nunca importar componentes
de funcionalidad. No hay `shared/models`, contratos duplicados ni barrels de compatibilidad.
El motor no importa transporte ni vistas: el archivo y sus celdas permanecen en el navegador.

## Costuras que deben conservarse

- `workbench/import-workbench.ts` crea el worker mediante
  `new URL('../engine/analysis.worker', import.meta.url)`; Angular debe empaquetarlo
  como módulo independiente. El worker conserva sus imports locales del motor.
- Los HTML grandes están junto a `catalog.ts` y `profiles.ts`; las plantillas pequeñas
  de los componentes auxiliares siguen inline. No cambian selectores, clases ni etiquetas.
- Los estilos de funcionalidad se cargan globalmente para conservar overlays y
  encapsulación. Este reparto TS/HTML no modifica SCSS ni el preset del sistema de diseño.
- Las pruebas de estilos trasladadas a `testing` apuntan a `../../styles.scss`.
  La suite y el build deben ejecutarse sobre el árbol integrado con sus estilos definitivos.
