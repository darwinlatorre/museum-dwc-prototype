package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper.CatalogHttpMapper;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogHttpMapperTests {
    private final CatalogHttpMapper mapper = new CatalogHttpMapper();

    @Test
    void statusMapsEveryFieldWithoutExposingDomainRecords() {
        Instant time = Instant.parse("2026-01-01T00:00:00Z");
        var active = new CatalogStatus.Active("rev", "hash", 4, time, 414, 2, 3, 1, Map.of("terms.csv", "source-hash"));
        var source = new CatalogStatus(active, 7, time.plusSeconds(5), "Fallo anterior");
        var response = mapper.toResponse(source);
        assertThat(response.active().revision()).isEqualTo("rev");
        assertThat(response.active().hash()).isEqualTo("hash");
        assertThat(response.active().snapshotVersion()).isEqualTo(4);
        assertThat(response.active().activatedAt()).isEqualTo(time);
        assertThat(response.active().termCount()).isEqualTo(414);
        assertThat(response.active().added()).isEqualTo(2);
        assertThat(response.active().modified()).isEqualTo(3);
        assertThat(response.active().deprecated()).isEqualTo(1);
        assertThat(response.active().sourceHashes()).isEqualTo(Map.of("terms.csv", "source-hash"));
        assertThat(response.attempts()).isEqualTo(7);
        assertThat(response.lastAttempt()).isEqualTo(time.plusSeconds(5));
        assertThat(response.lastFailure()).isEqualTo("Fallo anterior");
        var json = JsonMapper.builder().build();
        assertThat(json.writeValueAsString(response)).isEqualTo(json.writeValueAsString(source));
    }

    @Test
    void allOutcomesKeepThePublicSyncShapeAndNullAttemptMetadata() {
        var active = new CatalogStatus.Active("bundled", "hash", 0, Instant.EPOCH, 414, 0, 0, 0, Map.of());
        var status = new CatalogStatus(active, 0, null, null);
        var json = JsonMapper.builder().build();
        for (var outcome : CatalogOperations.Outcome.values()) {
            var result = new CatalogOperations.Result(outcome, status, new CatalogOperations.Attempt(null, false, false));
            var response = mapper.toResponse(result);
            assertThat(response.outcome()).isEqualTo(outcome.name());
            assertThat(response.status().lastAttempt()).isNull();
            assertThat(response.status().lastFailure()).isNull();
            assertThat(response.status().active().sourceHashes()).isEmpty();
            assertThat(json.readTree(json.writeValueAsString(response)).propertyNames())
                .containsExactly("outcome", "status");
        }
    }
}
