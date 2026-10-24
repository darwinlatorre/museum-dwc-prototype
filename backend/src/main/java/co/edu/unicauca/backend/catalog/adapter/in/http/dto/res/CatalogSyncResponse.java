package co.edu.unicauca.backend.catalog.adapter.in.http.dto.res;

import co.edu.unicauca.backend.catalog.domain.CatalogStatus;

/** Resultado del intento manual, distinto del éxito del transporte HTTP. */
public record CatalogSyncResponse(String outcome, CatalogStatus status) {}
