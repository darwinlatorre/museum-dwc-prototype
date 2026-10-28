import csv
import hashlib
import json
import pathlib
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'backend/src/main/resources/data'
COLLECTION = 'occurrenceID basisOfRecord institutionCode collectionCode type catalogNumber institutionID collectionID country scientificName taxonRank recordedBy eventDate year month day stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude identifiedBy order superfamily family subfamily tribe subtribe genus'.split()
BASE = 'occurrenceID basisOfRecord institutionCode type institutionID country scientificName taxonRank'.split()
EXPECTED = {
    'collection': COLLECTION,
    'permit': BASE + 'individualCount organismQuantity organismQuantityType recordedBy preparations disposition eventDate stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude geodeticDatum'.split(),
    'sampling': BASE + 'eventID eventDate'.split(),
    'marine': BASE + 'occurrenceStatus eventID eventDate locality decimalLatitude decimalLongitude scientificNameID'.split(),
    'other': BASE,
}

class SeedTests(unittest.TestCase):
    def test_exact_global_matrix(self):
        seed = json.loads((DATA / 'validation-configuration.json').read_text())
        self.assertEqual(seed, {'revision': 0, 'contexts': [
            {'context': context, 'requiredFields': fields} for context, fields in EXPECTED.items()]})
        self.assertEqual([len(fields) for fields in EXPECTED.values()], [30, 22, 10, 15, 8])
        self.assertNotIn('disposition', EXPECTED['collection'])
        self.assertIn('disposition', EXPECTED['permit'])
        for fields in EXPECTED.values():
            self.assertEqual(len(fields), len(set(fields)))

    def test_generation_is_idempotent_and_preserves_evidence(self):
        protected = [DATA / 'catalog.json', DATA / 'provenance.json', ROOT / 'sources/sib/instructions.json']
        before = {path: path.read_bytes() for path in protected}
        seed = DATA / 'validation-configuration.json'
        def generate():
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/build_seeds.py')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, 'Generated 414 terms and 5 validation contexts.\n')
            self.assertEqual(result.stderr, '')
            self.assertEqual({path: path.read_bytes() for path in protected}, before)
            self.assertFalse((DATA / 'profiles.json').exists())
        generate()
        first, timestamp = seed.read_bytes(), seed.stat().st_mtime_ns
        generate()
        self.assertEqual(seed.read_bytes(), first)
        self.assertEqual(seed.stat().st_mtime_ns, timestamp)

    def test_catalog_has_official_metadata_and_no_required_flag(self):
        terms = json.loads((DATA / 'catalog.json').read_text())
        self.assertEqual(len(terms), 414)
        self.assertEqual(len({term['uri'] for term in terms}), len(terms))
        self.assertEqual(sum(term['category'] == '' for term in terms), 52)
        for term in terms:
            self.assertTrue(all(term[key] for key in ('name', 'uri', 'definition', 'status')))
            self.assertIsInstance(term['category'], str)
            self.assertNotIn('required', term)
        by_uri = {term['uri']: term for term in terms}
        for path in (ROOT / 'sources/tdwg').glob('*.csv'):
            with path.open() as source:
                for row in csv.DictReader(source):
                    term = by_uri[row['term_isDefinedBy'] + row['term_localName']]
                    self.assertEqual(term['definition'], row['rdfs_comment'])
                    self.assertEqual(term['category'], row['tdwgutility_organizedInClass'])

if __name__ == '__main__':
    unittest.main()
