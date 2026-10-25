package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogActiveResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogStatusResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogSyncResponse;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class)
public interface CatalogHttpMapper {
    CatalogActiveResponse toResponse(CatalogStatus.Active active);
    CatalogStatusResponse toResponse(CatalogStatus status);
    CatalogSyncResponse toResponse(CatalogOperations.Result result);
}
