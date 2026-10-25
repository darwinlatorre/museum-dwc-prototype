package co.edu.unicauca.backend.catalog.domain;

import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;

import co.edu.unicauca.backend.catalog.domain.model.Term;

import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CatalogLockedCurrentPolicyTests {
    @Test
    void downloadedCandidateCannotRemoveUriFromCurrentSnapshot() {
        var original = new Term(
            "n", "https://example.org/n", " original \n", "", "current");
        var newer = new Term(
            "new", "https://example.org/new", "new", "", "current");
        var downloadedEarlier = new CatalogCandidate(
            "r1", List.of(original), "old", "h1", "raw", Map.of());

        var error = assertThrows(IllegalArgumentException.class,
            () -> CatalogPolicy.compare(
                List.of(original, newer), downloadedEarlier));

        assertEquals(
            "La fuente TDWG omite términos existentes; se conserva la última versión válida.",
            error.getMessage());
        assertEquals(" original \n", original.definition());
        assertEquals("", original.category());
        assertEquals(List.of(original), downloadedEarlier.terms());
    }
}
