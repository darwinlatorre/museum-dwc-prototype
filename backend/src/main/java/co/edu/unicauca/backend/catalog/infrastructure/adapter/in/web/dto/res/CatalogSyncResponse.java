package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res;

import lombok.Builder;

/** Resultado del intento manual, distinto del éxito del transporte HTTP. */
@Builder
public record CatalogSyncResponse(String outcome, CatalogStatusResponse status) {}
