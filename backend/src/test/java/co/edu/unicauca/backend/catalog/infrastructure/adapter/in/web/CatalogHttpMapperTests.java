package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper.CatalogHttpMapper;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogHttpMapperTests {
    private final CatalogHttpMapper mapper = Mappers.getMapper(CatalogHttpMapper.class);

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
    void generatedMapperKeepsExactPublicJsonShape() {
        var active = CatalogStatus.Active.builder().revision("rev").hash("hash").snapshotVersion(4)
            .termCount(414).added(2).modified(3).deprecated(1).sourceHashes(Map.of("source", "hash")).build();
        var status = CatalogStatus.builder().active(active).attempts(7).lastFailure("Fallo anterior").build();
        var result = new CatalogOperations.Result(CatalogOperations.Outcome.SUCCESS, status,
            new CatalogOperations.Attempt(99L, true, true));
        var json = JsonMapper.builder().build();
        assertThat(json.readTree(json.writeValueAsString(mapper.toResponse(result)))).isEqualTo(json.readTree("""
            {"outcome":"SUCCESS","status":{"active":{"revision":"rev","hash":"hash","snapshotVersion":4,
            "activatedAt":null,"termCount":414,"added":2,"modified":3,"deprecated":1,
            "sourceHashes":{"source":"hash"}},"attempts":7,"lastAttempt":null,"lastFailure":"Fallo anterior"}}
            """));
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
