package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.catalog.domain.identity.CatalogHash;
import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.domain.model.Term;
import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity.CatalogSnapshot;
import java.time.Instant;
import java.util.List;
import java.util.TreeMap;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/** Convierte representaciones; la generación, el bloqueo y la política pertenecen al adaptador. */
public class CatalogPersistenceMapper {
    private final ObjectMapper json;

    public CatalogPersistenceMapper(ObjectMapper json) { this.json = json; }

    public List<Term> terms(String payload) {
        return json.readValue(payload, new TypeReference<>() {});
    }

    public CatalogStatus toDomain(CatalogSnapshot snapshot) {
        var hashes = new TreeMap<String, String>();
        json.readTree(snapshot.getRawSources()).properties().forEach(entry ->
            hashes.put(entry.getKey(), CatalogHash.hash(entry.getValue().asString())));
        return new CatalogStatus(new CatalogStatus.Active(snapshot.getSourceRevision(), snapshot.getSourceHash(),
            snapshot.getSnapshotVersion(), snapshot.getActivatedAt(), snapshot.getTermCount(),
            snapshot.getAdded(), snapshot.getModified(), snapshot.getDeprecated(), hashes),
            snapshot.getGeneration(), snapshot.getLastAttempt(), snapshot.getLastFailure());
    }

    public void initialize(CatalogSnapshot snapshot, String payload, String provenance, int count, Instant time) {
        snapshot.setPayload(payload);
        snapshot.setSourceHash(CatalogHash.hash(payload));
        snapshot.setSourceRevision("bundled");
        snapshot.setRawSources("{}");
        snapshot.setSeedProvenance(provenance);
        snapshot.setTermCount(count);
        snapshot.setActivatedAt(time);
    }

    public void replace(CatalogSnapshot snapshot, CatalogCandidate candidate, CatalogPolicy.Diff diff,
                        long version, Instant time) {
        snapshot.setPayload(candidate.payload());
        snapshot.setSourceHash(candidate.hash());
        snapshot.setSourceRevision(candidate.revision());
        snapshot.setRawSources(candidate.rawSources());
        snapshot.setActivatedAt(time);
        snapshot.setTermCount(candidate.terms().size());
        snapshot.setAdded(diff.added());
        snapshot.setModified(diff.modified());
        snapshot.setDeprecated(diff.deprecated());
        snapshot.setSnapshotVersion(version);
    }
}
