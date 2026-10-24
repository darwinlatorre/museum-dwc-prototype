package co.edu.unicauca.backend.catalog.domain;

import java.util.List;
import java.util.Map;

/** Una fuente completa ya interpretada por el adaptador TDWG. Los textos no se normalizan. */
public record CatalogCandidate(String revision, List<Term> terms, String payload, String hash,
                               String rawSources, Map<String, String> hashes) {
    public CatalogCandidate {
        terms = List.copyOf(terms);
        hashes = Map.copyOf(hashes);
    }
}
