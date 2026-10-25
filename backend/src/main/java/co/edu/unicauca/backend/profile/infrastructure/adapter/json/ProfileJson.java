package co.edu.unicauca.backend.profile.infrastructure.adapter.json;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import com.fasterxml.jackson.annotation.JsonCreator;
import tools.jackson.databind.JsonNode;
import java.util.List;

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

    public record Rule(String field, Kind kind, Severity severity, Condition condition, String message, String source) {
        public Profile.Rule toDomain() {
            return new Profile.Rule(field, kind == null ? null : Profile.Kind.valueOf(kind.name()),
                severity == null ? null : Profile.Severity.valueOf(severity.name()),
                condition == null ? null : Profile.Condition.valueOf(condition.name()), message, source);
        }
    }

    public record Seed(String id, String name, String version, Profile.Status status, long revision,
                       String description, List<Rule> rules) {
        public Profile toDomain() {
            return Profile.builder().id(id).name(name).version(version).status(status).revision(revision)
                .description(description)
                .rules(rules == null ? null : rules.stream().map(rule -> rule == null ? null : rule.toDomain()).toList())
                .build();
        }
    }
}
