import json
import pathlib
import unittest

DATA = pathlib.Path(__file__).resolve().parents[1] / 'backend/src/main/resources/data'
MUSEUM = 'catalogNumber recordedBy eventDate year month day country stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude identifiedBy scientificName order superfamily family subfamily tribe subtribe genus'.split()

class SeedTests(unittest.TestCase):
    def test_catalog_has_official_metadata_and_no_required_flag(self):
        terms = json.loads((DATA / 'catalog.json').read_text())
        self.assertGreater(len(terms), 350)
        self.assertEqual(len({t['uri'] for t in terms}), len(terms))
        for term in terms:
            self.assertTrue(all(term[k] for k in ('name','uri','definition','category','status')))
            self.assertNotIn('required', term)
        self.assertTrue(any(t['status'] == 'deprecated' for t in terms))

    def test_museum_has_exact_requested_required_fields(self):
        profiles = json.loads((DATA / 'profiles.json').read_text())
        museum = next(p for p in profiles if p['version'] == '1.0')
        self.assertEqual(set(MUSEUM), {r['field'] for r in museum['rules'] if r['kind'] == 'required'})
        self.assertTrue(all(r['condition'] == 'always' for r in museum['rules']))

    def test_sib_does_not_require_collection_fields_unconditionally(self):
        sib = next(p for p in json.loads((DATA / 'profiles.json').read_text()) if p['version'] == '4.1')
        unconditional = {r['field'] for r in sib['rules'] if r['condition'] == 'always' and r['kind'] == 'required'}
        self.assertEqual(unconditional, set('occurrenceID basisOfRecord institutionCode institutionID type country scientificName taxonRank'.split()))
        for field in ['collectionCode','collectionID','catalogNumber']:
            self.assertTrue(any(r['field'] == field and r['condition'] == 'collection' for r in sib['rules']))
        self.assertTrue(any(r['field']=='scientificNameID' and r['condition']=='marine' for r in sib['rules']))

if __name__ == '__main__':
    unittest.main()
