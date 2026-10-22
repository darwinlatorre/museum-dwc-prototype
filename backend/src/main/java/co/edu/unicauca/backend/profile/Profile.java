package co.edu.unicauca.backend.profile;

import com.fasterxml.jackson.annotation.JsonCreator;
import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record Profile(String id, String name, String version, Status status, long revision,
                      String description, List<Rule> rules) {
    public enum Status { DRAFT, PUBLISHED }
    public enum Kind {
        required, requiredColumn, date, latitude, longitude;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Kind fromJson(JsonNode value) {
            return strictEnum(Kind.class, value);
        }
    }
    public enum Severity {
        ERROR, WARNING;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Severity fromJson(JsonNode value) {
            return strictEnum(Severity.class, value);
        }
    }
    public enum Condition {
        always, collection, permit, marine, permitAndCollection, sampling;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Condition fromJson(JsonNode value) {
            return strictEnum(Condition.class, value);
        }
    }
    private static <E extends Enum<E>> E strictEnum(Class<E> type, JsonNode value) {
        if (value == null || !value.isString()) {
            throw new IllegalArgumentException(type.getSimpleName() + " debe ser una cadena JSON");
        }
        return Enum.valueOf(type, value.stringValue());
    }

    public record Rule(@NotBlank @Size(max = 200) String field, @NotNull Kind kind,
                       @NotNull Severity severity, @NotNull Condition condition,
                       @NotBlank @Size(max = 2000) String message,
                       @NotBlank @Size(max = 4000) String source) {}

    public record Create(@NotBlank @Size(max = 200) String name,
                         @NotBlank @Size(max = 100) String version,
                         @NotNull @Size(max = 10000) String description,
                         @NotNull @Size(max = 2000) List<@NotNull @Valid Rule> rules) {}
    public record Update(@NotBlank @Size(max = 200) String name,
                         @NotBlank @Size(max = 100) String version,
                         @NotNull @Size(max = 10000) String description,
                         @NotNull @Size(max = 2000) List<@NotNull @Valid Rule> rules,
                         @NotNull @PositiveOrZero Long revision) {
        Create content() { return new Create(name, version, description, rules); }
    }
    public record Duplicate(@NotBlank @Size(max = 200) String name,
                            @NotBlank @Size(max = 100) String version) {}
}
