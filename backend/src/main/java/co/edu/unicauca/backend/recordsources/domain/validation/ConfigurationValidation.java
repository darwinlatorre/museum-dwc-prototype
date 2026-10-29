package co.edu.unicauca.backend.recordsources.domain.validation;

import co.edu.unicauca.backend.recordsources.domain.exception.ConfigurationValidationException;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;

public final class ConfigurationValidation {
    private ConfigurationValidation() {}

    public static List<ContextFields> copy(List<ContextFields> contexts) {
        if (contexts == null || contexts.size() != Context.values().length) fail();
        var seen = EnumSet.noneOf(Context.class);
        for (ContextFields entry : contexts) {
            if (entry == null || entry.context() == null || !seen.add(entry.context())
                    || entry.requiredFields() == null || entry.optionalFields() == null
                    || (long) entry.requiredFields().size() + entry.optionalFields().size() > 500) fail();
            var fields = new HashSet<String>();
            for (var list : List.of(entry.requiredFields(), entry.optionalFields())) {
                for (String field : list) {
                    if (field == null || field.isBlank() || field.length() > 200 || !fields.add(field)) fail();
                }
            }
        }
        // Stable context ordering; field order and original text are never normalized.
        return EnumSet.allOf(Context.class).stream().map(context -> contexts.stream()
            .filter(entry -> entry.context() == context).findFirst().orElseThrow())
            .map(entry -> new ContextFields(entry.context(), List.copyOf(entry.requiredFields()),
                List.copyOf(entry.optionalFields()))).toList();
    }

    public static ValidationConfiguration copy(ValidationConfiguration configuration) {
        if (configuration == null || configuration.revision() < 0) fail();
        return new ValidationConfiguration(configuration.revision(), copy(configuration.contexts()));
    }

    private static void fail() { throw new ConfigurationValidationException(); }
}
