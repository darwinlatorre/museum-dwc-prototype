package co.edu.unicauca.backend.profile.infrastructure.adapter.json;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import com.fasterxml.jackson.annotation.JsonCreator;
import tools.jackson.databind.JsonNode;
import java.util.List;
import lombok.Builder;

/** Contratos JSON: la coerción de Jackson nunca entra al núcleo. */
public final class ProfileJson {
    private ProfileJson() {}

    public enum Kind {
        required, requiredColumn, date, latitude, longitude;
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Kind fromJson(JsonNode value) { return strictEnum(Kind.class, value); }
    }
    public enum Severity {
        ERROR, WARNING;
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Severity fromJson(JsonNode value) { return strictEnum(Severity.class, value); }
    }
    public enum Condition {
        always, collection, permit, marine, permitAndCollection, sampling;
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Condition fromJson(JsonNode value) { return strictEnum(Condition.class, value); }
    }

    private static <E extends Enum<E>> E strictEnum(Class<E> type, JsonNode value) {
        if (value == null || !value.isString()) {
            throw new IllegalArgumentException(type.getSimpleName() + " debe ser una cadena JSON");
        }
        return Enum.valueOf(type, value.stringValue());
    }

    @Builder
    public record Rule(String field, Kind kind, Severity severity, Condition condition, String message, String source) {}

    @Builder
    public record Seed(String id, String name, String version, Profile.Status status, long revision,
                       String description, List<Rule> rules) {}
}
