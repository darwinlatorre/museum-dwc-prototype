package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res;

/** Resultado del intento manual, distinto del éxito del transporte HTTP. */
public record CatalogSyncResponse(String outcome, CatalogStatusResponse status) {}
