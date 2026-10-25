package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res;

import lombok.Builder;
import java.time.Instant;

@Builder
public record CatalogStatusResponse(CatalogActiveResponse active, long attempts,
                                    Instant lastAttempt, String lastFailure) {}
