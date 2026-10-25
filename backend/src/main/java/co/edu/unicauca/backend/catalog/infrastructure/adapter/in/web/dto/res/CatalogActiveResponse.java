package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res;

import java.time.Instant;
import java.util.Map;

public record CatalogActiveResponse(String revision, String hash, long snapshotVersion,
                                    Instant activatedAt, int termCount, int added, int modified,
                                    int deprecated, Map<String, String> sourceHashes) {}
