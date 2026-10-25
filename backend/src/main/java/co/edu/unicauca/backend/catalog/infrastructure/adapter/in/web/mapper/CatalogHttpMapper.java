package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogActiveResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogStatusResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogSyncResponse;

public class CatalogHttpMapper {
    public CatalogStatusResponse toResponse(CatalogStatus status) {
        var active = status.active();
        return new CatalogStatusResponse(new CatalogActiveResponse(active.revision(), active.hash(),
            active.snapshotVersion(), active.activatedAt(), active.termCount(), active.added(),
            active.modified(), active.deprecated(), active.sourceHashes()),
            status.attempts(), status.lastAttempt(), status.lastFailure());
    }

    public CatalogSyncResponse toResponse(CatalogOperations.Result result) {
        return new CatalogSyncResponse(result.outcome().name(), toResponse(result.status()));
    }
}
