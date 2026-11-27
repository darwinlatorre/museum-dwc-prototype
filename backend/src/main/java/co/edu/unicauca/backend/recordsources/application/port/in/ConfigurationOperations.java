package co.edu.unicauca.backend.recordsources.application.port.in;

import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;

public interface ConfigurationOperations {
    ValidationConfiguration get();
    ValidationConfiguration update(ConfigurationUpdate command);
    void initialize(ValidationConfiguration seed);
}
