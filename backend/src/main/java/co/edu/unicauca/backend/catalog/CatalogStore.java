package co.edu.unicauca.backend.catalog;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CatalogStore {
    private final CatalogRepository repository;
    private final ObjectMapper json;
    private final Clock clock;

    CatalogStore(CatalogRepository repository, ObjectMapper json, Clock clock) {
        this.repository = repository;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public void initialize() throws IOException {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.payload != null) return;
        String payload = resource("catalog.json");
        List<CatalogController.Term> seed = json.readValue(payload, new TypeReference<>() {});
        if (seed.isEmpty()) throw new IOException("El catálogo inicial TDWG está vacío.");
        snapshot.payload = payload;
        snapshot.sourceHash = CatalogParser.hash(payload);
        snapshot.sourceRevision = "bundled";
        snapshot.rawSources = "{}";
        snapshot.seedProvenance = resource("provenance.json");
        snapshot.termCount = seed.size();
        snapshot.activatedAt = clock.instant();
    }

    @Transactional(readOnly = true)
    public String payload() { return current().payload; }

    @Transactional(readOnly = true)
    public Status status() {
        CatalogSnapshot snapshot = current();
        Map<String, String> hashes = new java.util.TreeMap<>();
        json.readTree(snapshot.rawSources).properties().forEach(entry -> hashes.put(entry.getKey(), CatalogParser.hash(entry.getValue().asString())));
        return new Status(new Active(snapshot.sourceRevision, snapshot.sourceHash, snapshot.snapshotVersion,
            snapshot.activatedAt, snapshot.termCount, snapshot.added, snapshot.modified, snapshot.deprecated, hashes),
            snapshot.generation, snapshot.lastAttempt, snapshot.lastFailure);
    }

    @Transactional
    public long beginAttempt() {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        snapshot.lastAttempt = clock.instant();
        return ++snapshot.generation;
    }

    @Transactional
    public void activate(long generation, CatalogParser.Candidate candidate) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.generation != generation) return;
        if (candidate.hash().equals(snapshot.sourceHash) && candidate.revision().equals(snapshot.sourceRevision)) {
            snapshot.lastFailure = null;
            return;
        }
        Map<String, CatalogController.Term> previous = new HashMap<>();
        List<CatalogController.Term> stored = json.readValue(snapshot.payload, new TypeReference<>() {});
        stored.forEach(term -> previous.put(term.uri(), term));
        var candidateUris = candidate.terms().stream().map(CatalogController.Term::uri).collect(java.util.stream.Collectors.toSet());
        if (!candidateUris.containsAll(previous.keySet())) {
            throw new IllegalArgumentException("La fuente TDWG omite términos existentes; se conserva la última versión válida.");
        }
        int added = 0, modified = 0, deprecated = 0;
        for (var term : candidate.terms()) {
            var old = previous.get(term.uri());
            if (old == null) added++;
            else if (!old.equals(term)) modified++;
            if (term.status().equals("deprecated") && (old == null || !old.status().equals("deprecated"))) deprecated++;
        }
        snapshot.payload = candidate.payload();
        snapshot.sourceHash = candidate.hash();
        snapshot.sourceRevision = candidate.revision();
        snapshot.rawSources = candidate.rawSources();
        snapshot.activatedAt = clock.instant();
        snapshot.termCount = candidate.terms().size();
        snapshot.added = added;
        snapshot.modified = modified;
        snapshot.deprecated = deprecated;
        snapshot.snapshotVersion++;
        snapshot.lastFailure = null;
    }

    @Transactional
    public void fail(long generation) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.generation == generation) snapshot.lastFailure = "No se pudo actualizar el catálogo TDWG; se conserva la última versión válida.";
    }

    private CatalogSnapshot current() { return repository.findById(1).orElseThrow(); }
    private String resource(String name) throws IOException {
        try (var input = new ClassPathResource("data/" + name).getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public record Active(String revision, String hash, long snapshotVersion, Instant activatedAt, int termCount,
                         int added, int modified, int deprecated, Map<String, String> sourceHashes) {}
    public record Status(Active active, long attempts, Instant lastAttempt, String lastFailure) {}
}
