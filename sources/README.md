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

## Idioma, atribución y licencias

Se preservan sin traducción los archivos oficiales, los nombres Darwin Core, las URI, las definiciones citadas y las demás evidencias originales. La interfaz identifica las definiciones del catálogo como texto original en inglés. Esta conservación permite contrastar la fuente exacta y evita presentar una traducción no oficial como definición normativa. Los textos de la aplicación y sus diagnósticos predeterminados se muestran en español, sin reescribir registros publicados.

**Darwin Core:** Biodiversity Information Standards (TDWG), https://dwc.tdwg.org/, bajo **CC BY 4.0**; licencia verificada en https://raw.githubusercontent.com/tdwg/dwc/master/LICENSE. El catálogo conserva las definiciones originales y las URI canónicas, incluidos los términos Dublin Core importados. `status` se deriva de `term_deprecated` (`current`/`deprecated`), no de la obligatoriedad.

**Excel SiB y datos extraídos:** Plata C, Ortiz R, Marentes E, Velásquez J, Diaz J, Escobar D, Castro C, Leuro N, Sánchez L. 2024. *Plantilla para la publicación de registros biológicos*. Sistema de Información sobre Biodiversidad de Colombia, versión 4.1, Bogotá, D.C. El Excel y los datos del perfil SiB derivados se atribuyen y comparten bajo **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/.

Los requisitos del Museo 1.0 fueron aportados por el solicitante de este proyecto, no por TDWG ni SiB.
