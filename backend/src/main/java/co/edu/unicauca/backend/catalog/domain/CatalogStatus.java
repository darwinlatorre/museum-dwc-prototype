package co.edu.unicauca.backend.catalog.domain;

import java.time.Instant;
import java.util.Map;

public record CatalogStatus(Active active, long attempts, Instant lastAttempt, String lastFailure) {
    public record Active(String revision, String hash, long snapshotVersion, Instant activatedAt, int termCount,
                         int added, int modified, int deprecated, Map<String, String> sourceHashes) {}
}
