package co.edu.unicauca.backend.recordsources.infrastructure.config;

import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.recordsources.application.port.out.ConfigurationStore;
import co.edu.unicauca.backend.recordsources.application.service.ConfigurationService;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.bootstrap.ConfigurationBootstrap;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.mapper.ConfigurationHttpMapper;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.JpaConfigurationStore;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.mapper.ConfigurationPersistenceMapper;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.repository.ConfigurationRepository;
import co.edu.unicauca.backend.recordsources.infrastructure.transaction.TransactionalConfigurationOperations;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class ConfigurationBeanConfig {
    @Bean ConfigurationHttpMapper configurationHttpMapper() { return Mappers.getMapper(ConfigurationHttpMapper.class); }
    @Bean ConfigurationStore configurationStore(ConfigurationRepository repository, ObjectMapper json) {
        return new JpaConfigurationStore(repository, Mappers.getMapper(ConfigurationPersistenceMapper.class), json);
    }
    @Bean ConfigurationOperations configurationOperations(ConfigurationStore store) {
        return new TransactionalConfigurationOperations(new ConfigurationService(store));
    }
    @Bean ConfigurationBootstrap configurationBootstrap(ConfigurationOperations operations, ObjectMapper json) {
        return new ConfigurationBootstrap(operations, Mappers.getMapper(ConfigurationJsonMapper.class), json);
    }
}
