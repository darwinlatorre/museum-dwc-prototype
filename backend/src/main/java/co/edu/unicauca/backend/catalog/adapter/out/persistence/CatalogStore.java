package co.edu.unicauca.backend.catalog.adapter.out.persistence;

import co.edu.unicauca.backend.catalog.domain.CatalogHash;
import co.edu.unicauca.backend.catalog.domain.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.CatalogPolicy;
import co.edu.unicauca.backend.catalog.domain.CatalogStatus;
import co.edu.unicauca.backend.catalog.domain.CatalogStatus.Active;
import co.edu.unicauca.backend.catalog.domain.Term;

import org.springframework.core.io.ClassPathResource;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.List;
import java.util.Map;

public class CatalogStore implements co.edu.unicauca.backend.catalog.application.port.out.CatalogStore {
    private final CatalogRepository repository;
    private final ObjectMapper json;
    private final Clock clock;

    public CatalogStore(CatalogRepository repository, ObjectMapper json, Clock clock) {
        this.repository = repository;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public void initialize() throws IOException {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.payload != null) return;
        String payload = resource("catalog.json");
        List<Term> seed = json.readValue(payload, new TypeReference<>() {});
        if (seed.isEmpty()) throw new IOException("El catálogo inicial TDWG está vacío.");
        snapshot.payload = payload;
        snapshot.sourceHash = CatalogHash.hash(payload);
        snapshot.sourceRevision = "bundled";
        snapshot.rawSources = "{}";
        snapshot.seedProvenance = resource("provenance.json");
        snapshot.termCount = seed.size();
        snapshot.activatedAt = clock.instant();
    }

    @Transactional(readOnly = true)
    public String payload() { return current().payload; }

    @Transactional(readOnly = true)
    public CatalogStatus status() {
        CatalogSnapshot snapshot = current();
        Map<String, String> hashes = new java.util.TreeMap<>();
        json.readTree(snapshot.rawSources).properties().forEach(entry -> hashes.put(entry.getKey(), CatalogHash.hash(entry.getValue().asString())));
        return new CatalogStatus(new Active(snapshot.sourceRevision, snapshot.sourceHash, snapshot.snapshotVersion,
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
    public void activate(long generation, CatalogCandidate candidate) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.generation != generation) return;
        if (CatalogPolicy.unchanged(candidate, snapshot.sourceHash, snapshot.sourceRevision)) {
            snapshot.lastFailure = null;
            return;
        }
        List<Term> stored = json.readValue(snapshot.payload, new TypeReference<>() {});
        var diff = CatalogPolicy.compare(stored, candidate);
        snapshot.payload = candidate.payload();
        snapshot.sourceHash = candidate.hash();
        snapshot.sourceRevision = candidate.revision();
        snapshot.rawSources = candidate.rawSources();
        snapshot.activatedAt = clock.instant();
        snapshot.termCount = candidate.terms().size();
        snapshot.added = diff.added();
        snapshot.modified = diff.modified();
        snapshot.deprecated = diff.deprecated();
        snapshot.snapshotVersion++;
        snapshot.lastFailure = null;
    }

    @Transactional
    public void fail(long generation) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.generation == generation) snapshot.lastFailure = CatalogPolicy.SYNC_FAILURE;
    }

    private CatalogSnapshot current() { return repository.findById(1).orElseThrow(); }
    private String resource(String name) throws IOException {
        try (var input = new ClassPathResource("data/" + name).getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
