package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.catalog.domain.identity.CatalogHash;
import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.model.Term;
import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity.CatalogSnapshot;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogPersistenceMapperTests {
    private final CatalogPersistenceMapper mapper = Mappers.getMapper(CatalogPersistenceMapper.class);
    private final ObjectMapper json = JsonMapper.builder().build();
    private static final Instant TIME = Instant.parse("2026-01-01T00:00:00Z");
    private static final Term TERM = new Term("name", "https://example.test/name", " Exact\ntext ", "", "current");

    @Test
    void initializeUpdatesManagedInstanceWithoutResettingIdentityAttemptOrDiffCounters() {
        var snapshot = snapshot();
        String payload = " \n" + json.writeValueAsString(List.of(TERM));
        String provenance = " exact provenance\n";

        mapper.initialize(snapshot, payload, provenance, 1, TIME, json);

        assertMetadata(snapshot);
        assertThat(snapshot.getSnapshotVersion()).isEqualTo(9);
        assertThat(snapshot.getAdded()).isEqualTo(4);
        assertThat(snapshot.getModified()).isEqualTo(5);
        assertThat(snapshot.getDeprecated()).isEqualTo(6);
        assertThat(snapshot.getPayload()).isEqualTo(payload);
        assertThat(snapshot.getSourceHash()).isEqualTo(CatalogHash.hash(payload));
        assertThat(snapshot.getSourceRevision()).isEqualTo("bundled");
        assertThat(snapshot.getRawSources()).isEqualTo("{}");
        assertThat(snapshot.getSeedProvenance()).isEqualTo(provenance);
        assertThat(snapshot.getActivatedAt()).isEqualTo(TIME);
        assertThat(snapshot.getTermCount()).isEqualTo(1);
        assertThat(mapper.terms(snapshot.getPayload(), json)).containsExactly(TERM);
    }

    @Test
    void replaceUpdatesManagedInstanceButNotIdentityAttemptOrSeedProvenance() {
        var snapshot = snapshot();
        String payload = json.writeValueAsString(List.of(TERM));
        String rawSources = json.writeValueAsString(Map.of("terms.csv", " Exact raw\n"));
        var candidate = CatalogCandidate.builder().revision("revision").terms(List.of(TERM)).payload(payload)
            .hash("candidate hash").rawSources(rawSources).hashes(Map.of("terms.csv", "ignored hash")).build();

        mapper.replace(snapshot, candidate, new CatalogPolicy.Diff(1, 2, 3), 10, TIME, json);

        assertMetadata(snapshot);
        assertThat(snapshot.getSeedProvenance()).isEqualTo("original provenance");
        assertThat(snapshot.getPayload()).isEqualTo(payload);
        assertThat(snapshot.getSourceHash()).isEqualTo("candidate hash");
        assertThat(snapshot.getSourceRevision()).isEqualTo("revision");
        assertThat(snapshot.getRawSources()).isEqualTo(rawSources);
        assertThat(snapshot.getActivatedAt()).isEqualTo(TIME);
        assertThat(snapshot.getTermCount()).isEqualTo(1);
        assertThat(snapshot.getSnapshotVersion()).isEqualTo(10);
        assertThat(snapshot.getAdded()).isEqualTo(1);
        assertThat(snapshot.getModified()).isEqualTo(2);
        assertThat(snapshot.getDeprecated()).isEqualTo(3);

        var status = mapper.toDomain(snapshot, json);
        assertThat(status.attempts()).isEqualTo(7);
        assertThat(status.lastAttempt()).isEqualTo(TIME.minusSeconds(1));
        assertThat(status.lastFailure()).isEqualTo("previous failure");
        assertThat(status.active().revision()).isEqualTo("revision");
        assertThat(status.active().hash()).isEqualTo("candidate hash");
        assertThat(status.active().snapshotVersion()).isEqualTo(10);
        assertThat(status.active().activatedAt()).isEqualTo(TIME);
        assertThat(status.active().termCount()).isEqualTo(1);
        assertThat(status.active().added()).isEqualTo(1);
        assertThat(status.active().modified()).isEqualTo(2);
        assertThat(status.active().deprecated()).isEqualTo(3);
        assertThat(status.active().sourceHashes()).containsExactlyEntriesOf(Map.of("terms.csv", CatalogHash.hash(" Exact raw\n")));
    }

    @Test
    void jsonContextIsSuppliedPerCallAndEmptySourcesStayEmpty() {
        var snapshot = snapshot();
        mapper.initialize(snapshot, "[]", "{}", 0, TIME, JsonMapper.builder().build());
        assertThat(mapper.toDomain(snapshot, JsonMapper.builder().build()).active().sourceHashes()).isEmpty();
        assertThat(mapper.terms("[]", JsonMapper.builder().build())).isEmpty();
    }

    private static CatalogSnapshot snapshot() {
        var snapshot = new TestSnapshot();
        // Sólo la fixture asigna el id: el mapper no dispone de setter de identidad.
        ReflectionTestUtils.setField(snapshot, "id", 31);
        snapshot.setGeneration(7);
        snapshot.setLastAttempt(TIME.minusSeconds(1));
        snapshot.setLastFailure("previous failure");
        snapshot.setSnapshotVersion(9);
        snapshot.setAdded(4);
        snapshot.setModified(5);
        snapshot.setDeprecated(6);
        snapshot.setSeedProvenance("original provenance");
        return snapshot;
    }

    private static void assertMetadata(CatalogSnapshot snapshot) {
        assertThat(snapshot.getId()).isEqualTo(31);
        assertThat(snapshot.getGeneration()).isEqualTo(7);
        assertThat(snapshot.getLastAttempt()).isEqualTo(TIME.minusSeconds(1));
        assertThat(snapshot.getLastFailure()).isEqualTo("previous failure");
    }

    private static class TestSnapshot extends CatalogSnapshot {}
}
