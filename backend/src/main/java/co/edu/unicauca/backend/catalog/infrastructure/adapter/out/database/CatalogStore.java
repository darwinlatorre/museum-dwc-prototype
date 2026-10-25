package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database;

import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity.CatalogSnapshot;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.mapper.CatalogPersistenceMapper;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.repository.CatalogRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import org.springframework.core.io.ClassPathResource;
import org.springframework.transaction.annotation.Transactional;

public class CatalogStore implements co.edu.unicauca.backend.catalog.application.port.out.CatalogStore {
    private final CatalogRepository repository;
    private final CatalogPersistenceMapper mapper;
    private final Clock clock;

    public CatalogStore(CatalogRepository repository, CatalogPersistenceMapper mapper, Clock clock) {
        this.repository = repository;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public void initialize() throws IOException {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.getPayload() != null) return;
        String payload = resource("catalog.json");
        var seed = mapper.terms(payload);
        if (seed.isEmpty()) throw new IOException("El catálogo inicial TDWG está vacío.");
        mapper.initialize(snapshot, payload, resource("provenance.json"), seed.size(), clock.instant());
    }

    @Transactional(readOnly = true)
    public String payload() { return current().getPayload(); }

    @Transactional(readOnly = true)
    public CatalogStatus status() { return mapper.toDomain(current()); }

    @Transactional
    public long beginAttempt() {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        snapshot.setLastAttempt(clock.instant());
        long generation = snapshot.getGeneration() + 1;
        snapshot.setGeneration(generation);
        return generation;
    }

    @Transactional
    public void activate(long generation, CatalogCandidate candidate) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.getGeneration() != generation) return;
        if (CatalogPolicy.unchanged(candidate, snapshot.getSourceHash(), snapshot.getSourceRevision())) {
            snapshot.setLastFailure(null);
            return;
        }
        // La política evalúa la instantánea vigente sin liberar el bloqueo.
        var diff = CatalogPolicy.compare(mapper.terms(snapshot.getPayload()), candidate);
        mapper.replace(snapshot, candidate, diff, snapshot.getSnapshotVersion() + 1, clock.instant());
        snapshot.setLastFailure(null);
    }

    @Transactional
    public void fail(long generation) {
        CatalogSnapshot snapshot = repository.lockSnapshot();
        if (snapshot.getGeneration() == generation) snapshot.setLastFailure(CatalogPolicy.SYNC_FAILURE);
    }

    private CatalogSnapshot current() { return repository.findById(1).orElseThrow(); }

    private String resource(String name) throws IOException {
        try (var input = new ClassPathResource("data/" + name).getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
