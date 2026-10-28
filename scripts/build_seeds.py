"""Rebuild pinned offline seeds; no network and no database writes."""
import csv
import hashlib
import json
import pathlib
import xml.etree.ElementTree as ET
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'backend/src/main/resources/data'
DATA.mkdir(parents=True, exist_ok=True)

def write_if_changed(path, content):
    # Do not rewrite seeds or source evidence when their bytes already match.
    if not path.exists() or path.read_text() != content:
        path.write_text(content)

terms = {}
for name in ['terms', 'dc', 'dcterms']:
    with (ROOT / f'sources/tdwg/{name}.csv').open() as file:
        for row in csv.DictReader(file):
            uri = row['term_isDefinedBy'] + row['term_localName']
            terms[uri] = dict(name=row['term_localName'], uri=uri,
                definition=row['rdfs_comment'], category=row['tdwgutility_organizedInClass'],
                status='deprecated' if row['term_deprecated'] else 'current')
write_if_changed(DATA / 'catalog.json', json.dumps(list(terms.values()), ensure_ascii=False, indent=2))

# Preserve the official evidence verbatim, independently of the local active policy.
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(ROOT / 'sources/sib/records-4.1.xlsx') as book:
    strings = [''.join(t.itertext()) for t in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si', ns)]
    rows = []
    for row in ET.fromstring(book.read('xl/worksheets/sheet1.xml')).findall('.//s:row', ns):
        cells = {}
        for cell in row.findall('s:c', ns):
            value = cell.find('s:v', ns)
            if value is not None:
                cells[cell.get('r')] = strings[int(value.text)] if cell.get('t') == 's' else value.text
        rows.append(cells)
write_if_changed(ROOT / 'sources/sib/instructions.json', json.dumps(rows, ensure_ascii=False, indent=2))

# Requisitos locales exactos de global-validation.md, no obligaciones universales TDWG.
base = 'occurrenceID basisOfRecord institutionCode type institutionID country scientificName taxonRank'.split()
matrix = {
    'collection': 'occurrenceID basisOfRecord institutionCode collectionCode type catalogNumber institutionID collectionID country scientificName taxonRank recordedBy eventDate year month day stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude identifiedBy order superfamily family subfamily tribe subtribe genus'.split(),
    'permit': base + 'individualCount organismQuantity organismQuantityType recordedBy preparations disposition eventDate stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude geodeticDatum'.split(),
    'sampling': base + 'eventID eventDate'.split(),
    'marine': base + 'occurrenceStatus eventID eventDate locality decimalLatitude decimalLongitude scientificNameID'.split(),
    'other': base,
}
configuration = dict(revision=0, contexts=[dict(context=key, requiredFields=fields) for key, fields in matrix.items()])
write_if_changed(DATA / 'validation-configuration.json', json.dumps(configuration, ensure_ascii=False, indent=2))
manifest = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'sources').rglob('*') if p.is_file() and p.suffix in ['.csv','.xlsx']}
write_if_changed(DATA / 'provenance.json', json.dumps(manifest, indent=2))
print(f'Generated {len(terms)} terms and {len(matrix)} validation contexts.')
