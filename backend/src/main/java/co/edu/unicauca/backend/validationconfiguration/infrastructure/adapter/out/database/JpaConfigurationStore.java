package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database;

import co.edu.unicauca.backend.validationconfiguration.application.port.out.ConfigurationStore;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.mapper.ConfigurationPersistenceMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

@RequiredArgsConstructor
public class JpaConfigurationStore implements ConfigurationStore {
    private static final short GLOBAL_ID = 1;
    private final ConfigurationRepository repository;
    private final ConfigurationPersistenceMapper mapper;
    private final ObjectMapper json;

    @Override public ValidationConfiguration get() {
        return mapper.toDomain(repository.findById(GLOBAL_ID).orElseThrow(), json);
    }
    @Override public ValidationConfiguration lock() {
        return mapper.toDomain(repository.lockGlobal().orElseThrow(), json);
    }
    @Override public void replace(ValidationConfiguration configuration) {
        var managed = repository.findById(GLOBAL_ID).orElseThrow();
        mapper.replace(managed, configuration, json);
        repository.saveAndFlush(managed);
    }
    @Override public void insertSeed(ValidationConfiguration seed) {
        repository.insertSeed(mapper.encode(seed.contexts(), json));
        repository.flush();
    }
}
