package co.edu.unicauca.backend.catalog.domain.model;

import lombok.Builder;
import java.time.Instant;
import java.util.Map;

@Builder
public record CatalogStatus(Active active, long attempts, Instant lastAttempt, String lastFailure) {
    @Builder
    public record Active(String revision, String hash, long snapshotVersion, Instant activatedAt, int termCount,
                         int added, int modified, int deprecated, Map<String, String> sourceHashes) {}
}
