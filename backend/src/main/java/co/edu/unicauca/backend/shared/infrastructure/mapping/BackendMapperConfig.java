package co.edu.unicauca.backend.shared.infrastructure.mapping;

import org.mapstruct.MapperConfig;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

/** Mappers generados sin descubrimiento implícito: la composición sigue en BeanConfig. */
@MapperConfig(componentModel = MappingConstants.ComponentModel.DEFAULT,
              unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface BackendMapperConfig {}
