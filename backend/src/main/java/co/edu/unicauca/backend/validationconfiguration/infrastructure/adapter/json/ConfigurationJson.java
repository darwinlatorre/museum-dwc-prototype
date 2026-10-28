package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import tools.jackson.databind.JsonNode;

/** Contrato JSON común a HTTP, semilla y persistencia, fuera del núcleo. */
public record ConfigurationJson(Long revision, List<ContextFields> contexts) {
    public enum ContextKey { collection, permit, sampling, marine, other }
    public record ContextFields(@NotNull ContextKey context,
            @NotNull @Size(max = 500) List<@NotBlank @Size(max = 200) String> requiredFields) {}

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static ConfigurationJson fromJson(JsonNode value) {
        properties(value, Set.of("revision", "contexts"));
        JsonNode revision = value.get("revision");
        JsonNode contexts = value.get("contexts");
        if (!revision.isIntegralNumber() || !revision.canConvertToLong() || revision.longValue() < 0
                || !contexts.isArray() || contexts.size() != 5) return invalid();
        var result = new ArrayList<ContextFields>();
        var seen = new HashSet<ContextKey>();
        for (JsonNode entry : contexts) {
            properties(entry, Set.of("context", "requiredFields"));
            JsonNode key = entry.get("context");
            JsonNode fields = entry.get("requiredFields");
            if (!key.isString() || !fields.isArray() || fields.size() > 500) return invalid();
            ContextKey context = ContextKey.valueOf(key.stringValue());
            if (!seen.add(context)) return invalid();
            var text = new ArrayList<String>();
            var unique = new HashSet<String>();
            for (JsonNode field : fields) {
                if (!field.isString() || field.stringValue().isBlank() || field.stringValue().length() > 200
                        || !unique.add(field.stringValue())) return invalid();
                text.add(field.stringValue());
            }
            result.add(new ContextFields(context, List.copyOf(text)));
        }
        return new ConfigurationJson(revision.longValue(), List.copyOf(result));
    }

    private static void properties(JsonNode value, Set<String> expected) {
        if (value == null || !value.isObject() || !value.propertyNames().equals(expected)) invalid();
    }
    private static <T> T invalid() { throw new IllegalArgumentException("Configuración JSON inválida"); }
}
