# Official vocabulary and profile evidence

These pinned snapshots make initialization reproducible and allow offline analysis. They are source data, not application-wide mandatory-field rules.

| File | Official source |
|---|---|
| `tdwg/terms.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/terms/terms.csv |
| `tdwg/dc.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/dc-for-dwc/dc-for-dwc.csv |
| `tdwg/dcterms.csv` | https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/dcterms-for-dwc/dcterms-for-dwc.csv |
| `sib/records-4.1.xlsx` | https://drive.google.com/uc?export=download&id=18TGecPD1dH3KgiuA0i3FXD3BoEyLz5MS |
| `sib/instructions.json` | Lossless nonempty-cell extraction of the workbook's `Instrucciones` sheet |

Start from https://dwc.tdwg.org/ and https://biodiversidad.co/recursos/plantillas-dwc/ to verify the publishers. `backend/src/main/resources/data/provenance.json` records SHA-256 hashes of original downloads. `scripts/build_seeds.py` rebuilds seeds without network access. Updating a snapshot does **not** silently update published database profiles: publish a new profile version explicitly.

## SiB 4.1 evidence and limitations

The downloaded workbook identifies itself as version 4.1, May 2024. Its `Instrucciones` matrix, rows 25–53, was read directly (not inferred from header colors).

- Eight unconditional candidate fields: occurrenceID, basisOfRecord, institutionCode, institutionID, type, country, scientificName, taxonRank.
- Collection context: collectionCode, collectionID, catalogNumber; disposition column is flagged with the ambiguity below.
- Permit context: collectors, quantities, preparations, event date, administrative location, elevation, coordinates and datum. The GGBN permit extension is also required by SiB, but is **not validated by this core-file MVP**.
- Marine context additionally includes occurrenceStatus, eventID, eventDate, locality, coordinates and scientificNameID. Sampling context requires eventID/eventDate.
- `disposition`: the matrix marks permit and collection origins. Its definition instructs `En colección` only for permitted specimens delivered to a collection and otherwise explicitly permits empty values. The seed checks column presence with a warning for permit/collection, and nonempty content for their intersection. It does not certify controlled vocabulary compliance.
- `individualCount**`: the matrix marks permit origin while official version history calls this field recommended. The seed emits a warning, not an unconditional error. Quantity requirements remain as listed in the matrix.
- `country` is required in the matrix, but term guidance warns against inventing a country when uncertain. Review a missing-country diagnostic with the publisher; never automatically fill it.

Term-specific explanations: https://biodiversidad.co/elementos-darwin-core. This MVP reports profile compliance, not SiB publication certification, taxonomic verification, GGBN validation or legal permit compliance.

## Attribution and licenses

Darwin Core vocabulary: Biodiversity Information Standards (TDWG), https://dwc.tdwg.org/, published under CC BY 4.0 (https://raw.githubusercontent.com/tdwg/dwc/master/LICENSE). The catalog preserves official English definitions and canonical URIs, including Dublin Core imports. `status` is derived from `term_deprecated` (current/deprecated), not from obligation.

SiB workbook and extracted instruction data: Plata C, Ortiz R, Marentes E, Velásquez J, Diaz J, Escobar D, Castro C, Leuro N, Sánchez L. 2024. *Plantilla para la publicación de registros biológicos*. Sistema de Información sobre Biodiversidad de Colombia, versión 4.1, Bogotá, D.C. Workbook and derived SiB profile data are attributed and shared under **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/. Museum requirements are supplied by this project's requester, not by TDWG or SiB.
