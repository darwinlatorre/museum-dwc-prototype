package co.edu.unicauca.backend.recordsources.application.port.in;

import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import java.util.Set;

/** La omisión pertenece al comando, nunca al estado persistido de configuración. */
public record ConfigurationUpdate(ValidationConfiguration configuration, Set<Context> preserveOptionalContexts) {
    public ConfigurationUpdate {
        preserveOptionalContexts = Set.copyOf(preserveOptionalContexts);
    }
}
