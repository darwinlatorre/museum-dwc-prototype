# Vocabulario oficial y evidencia de los perfiles

Estas copias fijadas permiten reproducir la carga inicial y analizar sin conexión. Son fuentes de datos, **no reglas universales de obligatoriedad**.

| Archivo | Fuente oficial |
|---|---|
| `tdwg/terms.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/terms/terms.csv |
| `tdwg/dc.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/dc-for-dwc/dc-for-dwc.csv |
| `tdwg/dcterms.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/dcterms-for-dwc/dcterms-for-dwc.csv |
| `sib/records-4.1.xlsx` | https://drive.google.com/uc?export=download&id=18TGecPD1dH3KgiuA0i3FXD3BoEyLz5MS |
| `sib/instructions.json` | Extracción de celdas no vacías de la hoja `Instrucciones`, conservando su contenido |

Las páginas https://dwc.tdwg.org/ y https://biodiversidad.co/recursos/plantillas-dwc/ permiten verificar a los publicadores. El archivo `backend/src/main/resources/data/provenance.json` registra los SHA-256 de las descargas originales. `scripts/build_seeds.py` reconstruye los recursos sin consultar la red.

Actualizar una copia de origen **no actualiza silenciosamente perfiles publicados** en la base. Las revisiones de requisitos deben publicarse como nuevas versiones.

## Actualización automática del vocabulario

https://dwc.tdwg.org/terms/ enlaza la lista completa, incluidos términos prestados y obsoletos. El README oficial https://raw.githubusercontent.com/tdwg/dwc/master/build/README.md identifica `rs.tdwg.org` como fuente autoritativa. Las URI canónicas Dublin Core no originan consultas a terceros: se usan exclusivamente sus importaciones mantenidas por TDWG.

El backend consulta `https://api.github.com/repos/tdwg/rs.tdwg.org/git/ref/heads/master` y fija los tres CSV al mismo commit antes de validarlos y activarlos conjuntamente. Almacena una única instantánea durable con CSV originales, hashes SHA-256 y revisión; conserva aparte los hashes históricos de `provenance.json`. La revisión de las copias locales originales es desconocida y no se inventa. Los fallos conservan la última versión válida. Si desaparece una URI previa se rechaza la actualización completa, sin inferir obsolescencia. Configuración, límites y observabilidad: [backend/README.md](../backend/README.md#sincronización-tdwg-y-última-versión-válida).

El generador sigue siendo offline y conserva la generación de los perfiles SiB/Museo originales. Solo escribe recursos cuyo contenido cambia; no reescribe semillas ni evidencia idénticas.

## Evidencia y limitaciones de SiB 4.1

El Excel descargado se identifica como versión 4.1, mayo de 2024. Se leyó directamente la matriz de la hoja `Instrucciones`, filas 25–53; no se infirió obligatoriedad a partir del color de los encabezados.

- Ocho campos candidatos incondicionales: `occurrenceID`, `basisOfRecord`, `institutionCode`, `institutionID`, `type`, `country`, `scientificName` y `taxonRank`.
- Contexto de colección: `collectionCode`, `collectionID` y `catalogNumber`; la columna `disposition` se informa con la ambigüedad explicada más abajo.
- Contexto de permiso: recolectores, cantidades, preparaciones, fecha del evento, ubicación administrativa, elevación, coordenadas y datum. SiB también exige la extensión de permisos GGBN, que **este MVP de archivo principal no valida**.
- Contexto marino: incluye `occurrenceStatus`, `eventID`, `eventDate`, `locality`, coordenadas y `scientificNameID`. El contexto de muestreo requiere `eventID` y `eventDate`.
- `disposition`: la matriz marca permiso y colección. La definición indica `En colección` para especímenes recolectados con permiso y entregados a una colección; en otros casos permite un valor vacío. El perfil inicial advierte si falta la columna en permiso o colección, y exige un valor no vacío cuando concurren ambos contextos. No certifica un vocabulario controlado.
- `individualCount**`: la matriz marca permiso, mientras que el historial oficial lo considera recomendado. El perfil emite una advertencia y no un error incondicional. Las reglas sobre cantidades conservan lo indicado por la matriz.
- `country`: la matriz lo exige, pero la guía advierte que no debe inventarse cuando se desconoce. Un diagnóstico por país faltante debe revisarse con el publicador, no corregirse automáticamente.

Las explicaciones por término están en https://biodiversidad.co/elementos-darwin-core. El MVP informa cumplimiento de perfiles; no certifica publicación SiB, verificación taxonómica, extensiones GGBN ni cumplimiento legal de permisos.

## Composición local Museo + SiB 1.0

`scripts/build_seeds.py` añade un tercer perfil sin cambiar los objetos originales Museo 1.0 y SiB Registros Biológicos 4.1. Reutiliza sus reglas, sin inferir nuevos requisitos biológicos. Recorre primero Museo y luego SiB, manteniendo el orden de primera aparición; deduplica únicamente la tupla exacta `(field, kind, severity, condition)`. De 58 reglas de origen resultan **56**: solo coinciden `country` y `scientificName` bajo `required`, `ERROR`, `always`. Hay **28 campos obligatorios siempre** (22 del Museo más ocho SiB, con esas dos coincidencias).

Cada `source` conserva la cita original precedida por el nombre y versión del perfil aportante; las coincidencias reúnen ambas citas con ` | `. TDWG no se atribuye políticas de colección. Se conservan las reglas distintas para un mismo campo, las severidades, `requiredColumn`, `permitAndCollection` y las discrepancias documentadas de `disposition` e `individualCount`; sus mensajes nuevos explican esas limitaciones en español. No se traduce ni reescribe la evidencia original.

La composición no constituye un perfil oficial SiB ni una certificación, y no convierte políticas locales en requisitos universales Darwin Core. Conserva la atribución y licencia de los datos derivados SiB indicadas abajo. Las pruebas fijan los hashes de los dos objetos originales y verifican la unión, procedencia y regeneración idempotente; `catalog.json`, `provenance.json` y `sib/instructions.json` permanecen intactos.

## Idioma, atribución y licencias

Se preservan sin traducción los archivos oficiales, los nombres Darwin Core, las URI, las definiciones citadas y las demás evidencias originales. La interfaz identifica las definiciones del catálogo como texto original en inglés. Esta conservación permite contrastar la fuente exacta y evita presentar una traducción no oficial como definición normativa. Los textos de la aplicación y sus diagnósticos predeterminados se muestran en español, sin reescribir registros publicados.

**Darwin Core:** Biodiversity Information Standards (TDWG), https://dwc.tdwg.org/, bajo **CC BY 4.0**; licencia verificada en https://raw.githubusercontent.com/tdwg/dwc/master/LICENSE. El catálogo conserva las definiciones originales y las URI canónicas, incluidos los términos Dublin Core importados. `status` se deriva de `term_deprecated` (vacío/`false`: `current`; `true`: `deprecated`), no de la obligatoriedad. Se conserva exactamente `rdfs_comment` como definición y `tdwgutility_organizedInClass` como categoría; una categoría ausente permanece vacía, sin fallback a `rdf_type`. Las copias actuales contienen 52 categorías vacías.

**Excel SiB y datos extraídos:** Plata C, Ortiz R, Marentes E, Velásquez J, Diaz J, Escobar D, Castro C, Leuro N, Sánchez L. 2024. *Plantilla para la publicación de registros biológicos*. Sistema de Información sobre Biodiversidad de Colombia, versión 4.1, Bogotá, D.C. El Excel y los datos del perfil SiB derivados se atribuyen y comparten bajo **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/.

Los requisitos del Museo 1.0 fueron aportados por el solicitante de este proyecto, no por TDWG ni SiB.
