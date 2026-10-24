package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res;

import java.time.Instant;

public record CatalogStatusResponse(CatalogActiveResponse active, long attempts,
                                    Instant lastAttempt, String lastFailure) {}
