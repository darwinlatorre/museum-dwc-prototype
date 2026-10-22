import csv
import hashlib
import subprocess
import sys
import uuid
import json
import pathlib
import unittest

DATA = pathlib.Path(__file__).resolve().parents[1] / 'backend/src/main/resources/data'
MUSEUM = 'catalogNumber recordedBy eventDate year month day country stateProvince county locality minimumElevationInMeters decimalLatitude decimalLongitude identifiedBy scientificName order superfamily family subfamily tribe subtribe genus'.split()

class SeedTests(unittest.TestCase):
    def test_original_profiles_are_unchanged(self):
        originals = json.loads((DATA / 'profiles.json').read_text())[:2]
        self.assertEqual([p['name'] for p in originals], ['SiB Registros Biológicos', 'Museo'])
        self.assertEqual([
            hashlib.sha256(json.dumps(p, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
            for p in originals
        ], [
            '7e09950225671a748942efca613b7bc285dc2fed03aab4a66a483423f28c89de',
            '2f7c6003e197e18a10621507971ac49c8e2bde49b2931e6d3f34e3621486004b',
        ])

    def test_combined_profile_is_exact_semantic_union_with_provenance(self):
        profiles = json.loads((DATA / 'profiles.json').read_text())
        self.assertEqual(len(profiles), 3)
        sib, museum, combined = profiles
        self.assertEqual(combined['name'], 'Museo + SiB')
        self.assertEqual(combined['version'], '1.0')
        self.assertEqual(combined['status'], 'PUBLISHED')
        self.assertEqual(combined['revision'], 0)
        self.assertEqual(combined['id'], str(uuid.uuid5(uuid.NAMESPACE_URL, 'unicauca/museum-sib')))
        self.assertEqual(len({p['id'] for p in profiles}), 3)
        def predicate(rule):
            return tuple(rule[k] for k in ('field', 'kind', 'severity', 'condition'))
        expected = {}
        for profile in (museum, sib):
            for rule in profile['rules']:
                expected.setdefault(predicate(rule), []).append(
                    f"{profile['name']} {profile['version']}: {rule['source']}")
        self.assertEqual(len(combined['rules']), 56)
        self.assertEqual(len({predicate(r) for r in combined['rules']}), 56)
        self.assertEqual([predicate(r) for r in combined['rules']], list(expected))
        for rule in combined['rules']:
            self.assertEqual(rule['source'], ' | '.join(expected[predicate(rule)]))
            self.assertNotIn('TDWG', rule['source'])
            self.assertNotIn(' is required', rule['message'])
            self.assertTrue(rule['message'].startswith(('Se requiere', 'La matriz', 'Documente')))
        always = {r['field'] for r in combined['rules'] if r['condition'] == 'always'}
        self.assertEqual(always, set(MUSEUM) | {
            r['field'] for r in sib['rules'] if r['condition'] == 'always'})
        for field in ('disposition', 'individualCount'):
            for original in [r for r in sib['rules'] if r['field'] == field]:
                self.assertIn(predicate(original), {predicate(r) for r in combined['rules']})
        messages = {r['field']: r['message'] for r in combined['rules'] if r['severity'] == 'WARNING'}
        self.assertIn('valor vacío', messages['disposition'])
        self.assertIn('recomendado', messages['individualCount'])
        self.assertIn('composición local', combined['description'])
        self.assertIn('no certifica', combined['description'])

    def test_generation_is_idempotent_and_preserves_other_outputs(self):
        root = DATA.parents[4]
        protected = [DATA / 'catalog.json', DATA / 'provenance.json',
                     root / 'sources/sib/instructions.json']
        before = {path: path.read_bytes() for path in protected}
        profiles_before = json.loads((DATA / 'profiles.json').read_text())[:2]
        def generate():
            result = subprocess.run([sys.executable, str(root / 'scripts/build_seeds.py')],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, 'Generated 414 terms and 3 profiles.\n')
            self.assertEqual(result.stderr, '')
            self.assertEqual({path: path.read_bytes() for path in protected}, before)
            self.assertEqual(json.loads((DATA / 'profiles.json').read_text())[:2], profiles_before)
        generate()
        first = (DATA / 'profiles.json').read_bytes()
        timestamp = (DATA / 'profiles.json').stat().st_mtime_ns
        generate()
        self.assertEqual((DATA / 'profiles.json').read_bytes(), first)
        self.assertEqual((DATA / 'profiles.json').stat().st_mtime_ns, timestamp)

    def test_catalog_has_official_metadata_and_no_required_flag(self):
        terms = json.loads((DATA / 'catalog.json').read_text())
        self.assertGreater(len(terms), 350)
        self.assertEqual(len({t['uri'] for t in terms}), len(terms))
        for term in terms:
            self.assertTrue(all(term[k] for k in ('name','uri','definition','status')))
            self.assertIsInstance(term['category'], str)
            self.assertNotIn('required', term)
        self.assertTrue(any(t['status'] == 'deprecated' for t in terms))
        by_uri = {t['uri']: t for t in terms}
        for path in (DATA.parents[4] / 'sources/tdwg').glob('*.csv'):
            with path.open() as source:
                for row in csv.DictReader(source):
                    term = by_uri[row['term_isDefinedBy'] + row['term_localName']]
                    self.assertEqual(term['definition'], row['rdfs_comment'])
                    self.assertEqual(term['category'], row['tdwgutility_organizedInClass'])

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
