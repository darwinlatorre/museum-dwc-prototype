package co.edu.unicauca.backend.catalog.domain;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CatalogPolicyTests {
    private static final Term CURRENT = new Term("name", "https://example.test/name", " Exact\ntext ", "", "current");
    private static final Term DEPRECATED = new Term("name", CURRENT.uri(), "Changed official text", "", "deprecated");

    @Test
    void missingUriIsRejectedWithoutChangingEitherInput() {
        var previous = new ArrayList<>(List.of(CURRENT));
        var candidate = candidate(List.of(new Term("other", "https://example.test/other", "definition", "", "current")));
        var exception = assertThrows(IllegalArgumentException.class, () -> CatalogPolicy.compare(previous, candidate));
        assertEquals("La fuente TDWG omite términos existentes; se conserva la última versión válida.", exception.getMessage());
        assertEquals(List.of(CURRENT), previous);
        assertEquals("https://example.test/other", candidate.terms().getFirst().uri());
    }

    @Test
    void recordsAddsExactTextModificationsAndNewDeprecations() {
        var added = new Term("new", "https://example.test/new", "definition", "", "deprecated");
        var candidate = candidate(List.of(DEPRECATED, added));
        assertEquals(new CatalogPolicy.Diff(1, 1, 2), CatalogPolicy.compare(List.of(CURRENT), candidate));
        assertEquals(" Exact\ntext ", CURRENT.definition());
        assertEquals("", candidate.terms().getFirst().category());
    }

    @Test
    void identicalTermsAndAlreadyDeprecatedTermsHaveNoDiff() {
        assertEquals(new CatalogPolicy.Diff(0, 0, 0), CatalogPolicy.compare(List.of(DEPRECATED), candidate(List.of(DEPRECATED))));
        assertEquals(new CatalogPolicy.Diff(0, 0, 0), CatalogPolicy.compare(List.of(CURRENT), candidate(List.of(CURRENT))));
    }

    @Test
    void reactivationIsAModificationNotANewDeprecation() {
        assertEquals(new CatalogPolicy.Diff(0, 1, 0), CatalogPolicy.compare(List.of(DEPRECATED), candidate(List.of(CURRENT))));
    }

    @Test
    void whitespaceAndCategoryChangesAreNotNormalizedAway() {
        var changed = new Term(CURRENT.name(), CURRENT.uri(), "Exact\ntext", "Category", CURRENT.status());
        assertEquals(new CatalogPolicy.Diff(0, 1, 0), CatalogPolicy.compare(List.of(CURRENT), candidate(List.of(changed))));
    }

    @Test
    void idempotenceRequiresBothHashAndRevision() {
        var candidate = candidate(List.of(CURRENT));
        assertTrue(CatalogPolicy.unchanged(candidate, "hash", "revision"));
        assertFalse(CatalogPolicy.unchanged(candidate, "different", "revision"));
        assertFalse(CatalogPolicy.unchanged(candidate, "hash", "different"));
    }

    @Test
    void candidateCopiesCollectionsButKeepsExactPayloadAndText() {
        var terms = new ArrayList<>(List.of(CURRENT));
        var hashes = new HashMap<>(Map.of("source", "hash"));
        var candidate = new CatalogCandidate("revision", terms, "  payload\n", "hash", " raw\n", hashes);
        terms.clear();
        hashes.clear();
        assertEquals(List.of(CURRENT), candidate.terms());
        assertEquals(Map.of("source", "hash"), candidate.hashes());
        assertEquals("  payload\n", candidate.payload());
        assertEquals(" raw\n", candidate.rawSources());
    }

    @Test
    void contentHashUsesExactUtf8WithoutNormalization() {
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", CatalogHash.hash(""));
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", CatalogHash.hash("abc"));
        assertNotEquals(CatalogHash.hash("texto"), CatalogHash.hash(" texto\n"));
    }

    private static CatalogCandidate candidate(List<Term> terms) {
        return new CatalogCandidate("revision", terms, "payload", "hash", "raw", Map.of());
    }
}
