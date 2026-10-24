package co.edu.unicauca.backend.catalog.domain.policy;

import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;

import co.edu.unicauca.backend.catalog.domain.model.Term;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

/** Se evalúa con la instantánea vigente bloqueada, nunca con una lectura previa a la transacción. */
public final class CatalogPolicy {
    public static final String SYNC_FAILURE =
        "No se pudo actualizar el catálogo TDWG; se conserva la última versión válida.";

    private CatalogPolicy() {}

    public static boolean unchanged(CatalogCandidate candidate, String hash, String revision) {
        return candidate.hash().equals(hash) && candidate.revision().equals(revision);
    }

    public static Diff compare(List<Term> stored, CatalogCandidate candidate) {
        var previous = new HashMap<String, Term>();
        stored.forEach(term -> previous.put(term.uri(), term));
        var candidateUris = candidate.terms().stream().map(Term::uri).collect(Collectors.toSet());
        if (!candidateUris.containsAll(previous.keySet())) {
            throw new IllegalArgumentException(
                "La fuente TDWG omite términos existentes; se conserva la última versión válida.");
        }
        int added = 0;
        int modified = 0;
        int deprecated = 0;
        for (Term term : candidate.terms()) {
            Term old = previous.get(term.uri());
            if (old == null) added++;
            else if (!old.equals(term)) modified++;
            if (term.status().equals("deprecated") && (old == null || !old.status().equals("deprecated"))) deprecated++;
        }
        return new Diff(added, modified, deprecated);
    }

    public record Diff(int added, int modified, int deprecated) {}
}
