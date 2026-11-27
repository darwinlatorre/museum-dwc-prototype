package co.edu.unicauca.backend.recordsources.infrastructure.adapter.json;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** JSON contract shared by HTTP, seed and persistence, outside the core. Typing comes from StrictJsonBeanConfig. */
public record ConfigurationJson(Long revision, List<ContextFields> contexts) {
    public enum ContextKey { collection, permit, sampling, marine, other }

    /**
     * Setter-based on purpose: an absent {@code optionalFields} stays {@code null} (preserve stored optional
     * fields), while an explicit JSON {@code null} is rejected by {@link Nulls#FAIL}.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static final class ContextFields {
        @NotNull private ContextKey context;
        @NotNull @Size(max = 500) private List<@NotBlank @Size(max = 200) String> requiredFields;
        @JsonSetter(nulls = Nulls.FAIL)
        @Size(max = 500) private List<@NotBlank @Size(max = 200) String> optionalFields;

        public boolean optionalFieldsPresent() { return optionalFields != null; }
    }
}
