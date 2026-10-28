package co.edu.unicauca.backend.validationconfiguration.infrastructure.config;

import co.edu.unicauca.backend.validationconfiguration.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.application.port.out.ConfigurationStore;
import co.edu.unicauca.backend.validationconfiguration.application.service.ConfigurationService;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.mapper.ConfigurationHttpMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.JpaConfigurationStore;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.mapper.ConfigurationPersistenceMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.repository.ConfigurationRepository;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.transaction.TransactionalConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class ConfigurationBeanConfig {
    @Bean @Primary ConfigurationJsonMapper configurationJsonMapper() { return Mappers.getMapper(ConfigurationJsonMapper.class); }
    @Bean ConfigurationHttpMapper configurationHttpMapper() { return Mappers.getMapper(ConfigurationHttpMapper.class); }
    @Bean ConfigurationPersistenceMapper configurationPersistenceMapper() { return Mappers.getMapper(ConfigurationPersistenceMapper.class); }
    @Bean ConfigurationStore configurationStore(ConfigurationRepository repository, ConfigurationPersistenceMapper mapper, ObjectMapper json) {
        return new JpaConfigurationStore(repository, mapper, json);
    }
    @Bean ConfigurationOperations configurationOperations(ConfigurationStore store) {
        return new TransactionalConfigurationOperations(new ConfigurationService(store));
    }
}
