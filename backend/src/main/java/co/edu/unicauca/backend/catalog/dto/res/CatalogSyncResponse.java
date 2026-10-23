package co.edu.unicauca.backend.catalog.dto.res;

import co.edu.unicauca.backend.catalog.CatalogStore;

/** Result of one manual attempt, distinct from HTTP transport success. */
public record CatalogSyncResponse(String outcome, CatalogStore.Status status) {}
