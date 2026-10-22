"""Rebuild pinned offline seeds; no network and no database writes."""
import csv
import hashlib
import json
import pathlib
import uuid
import xml.etree.ElementTree as ET
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'backend/src/main/resources/data'
DATA.mkdir(parents=True, exist_ok=True)
terms = {}
for name in ['terms', 'dc', 'dcterms']:
    with (ROOT / f'sources/tdwg/{name}.csv').open() as file:
        for row in csv.DictReader(file):
            uri = row['term_isDefinedBy'] + row['term_localName']
            terms[uri] = dict(name=row['term_localName'], uri=uri,
                definition=row['rdfs_comment'] or row['dcterms_description'] or row['label'],
                category=row['tdwgutility_organizedInClass'] or row['rdf_type'],
                status='deprecated' if row['term_deprecated'] else 'current')
(DATA / 'catalog.json').write_text(json.dumps(list(terms.values()), ensure_ascii=False, indent=2))

# Preserve the actual instruction matrix, not an inferred list from candidate fields.
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
(ROOT / 'sources/sib/instructions.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))

SOURCE = 'https://biodiversidad.co/recursos/plantillas-dwc/ (Registros Biológicos v4.1, Instrucciones rows 25–53)'
def rule(field, condition='always', kind='required', severity='ERROR', message=None):
    return dict(field=field, condition=condition, kind=kind, severity=severity,
        message=message or f'{field} is required for this context.', source=SOURCE)

sib = [rule(f) for f in 'occurrenceID basisOfRecord institutionCode institutionID type country scientificName taxonRank'.split()]
sib += [rule(f, 'collection') for f in 'collectionCode collectionID catalogNumber'.split()]
sib += [rule(f, 'permit') for f in 'organismQuantity organismQuantityType recordedBy preparations eventDate stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude geodeticDatum'.split()]
sib += [rule(f, 'marine') for f in 'occurrenceStatus eventID eventDate locality decimalLatitude decimalLongitude scientificNameID'.split()]
sib += [rule(f, 'sampling') for f in 'eventID eventDate'.split()]
# Table and definition disagree on empty disposition; preserve evidence without false rejection.
for context in ['permit', 'collection']:
    sib.append(rule('disposition', context, 'requiredColumn', 'WARNING',
        'SiB matrix requests disposition here; its definition permits an empty value unless collected under permit and deposited.'))
sib.append(rule('disposition', 'permitAndCollection', message='Document disposition (En colección) for permitted specimens deposited in a collection.'))
sib.append(rule('individualCount', 'permit', 'required', 'WARNING',
    'The v4.1 instruction matrix marks individualCount** but SiB version history calls it recommended; review quantity documentation.'))
MUSEUM = 'catalogNumber recordedBy eventDate year month day country stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude identifiedBy scientificName order superfamily family subfamily tribe subtribe genus'.split()
museum = [dict(rule(f), source='Museo de Historia Natural, Universidad del Cauca — requested profile 1.0') for f in MUSEUM]
profiles = []
for key, name, version, rules, description in [
    ('sib', 'SiB Registros Biológicos', '4.1', sib,
     'Based on official v4.1 XLSX instruction matrix (May 2024) and SiB term definitions. Select collection, permit, sampling and marine contexts explicitly. disposition and individualCount carry documented source discrepancies. Permit records also require a GGBN extension, which this core-only MVP does not validate. country must not be invented when unknown; review missing-country errors with the publisher.'),
    ('museum', 'Museo', '1.0', museum,
     'Museum-specific mandatory fields, independently versioned; these are not universal Darwin Core requirements.')]:
    profiles.append(dict(id=str(uuid.uuid5(uuid.NAMESPACE_URL, 'unicauca/'+key)), name=name, version=version,
        status='PUBLISHED', revision=0, description=description, rules=rules))
(DATA / 'profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2))
manifest = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'sources').rglob('*') if p.is_file() and p.suffix in ['.csv','.xlsx']}
(DATA / 'provenance.json').write_text(json.dumps(manifest, indent=2))
print(f'Generated {len(terms)} terms and {len(profiles)} profiles.')
