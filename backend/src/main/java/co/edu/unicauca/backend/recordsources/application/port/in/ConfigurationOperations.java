package co.edu.unicauca.backend.recordsources.application.port.in;

import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;

public interface ConfigurationOperations {
    ValidationConfiguration get();
    ValidationConfiguration update(ConfigurationUpdate command);
    default ValidationConfiguration update(ValidationConfiguration configuration) {
        return update(new ConfigurationUpdate(configuration, java.util.Set.of()));
    }
    void initialize(ValidationConfiguration seed);
}
