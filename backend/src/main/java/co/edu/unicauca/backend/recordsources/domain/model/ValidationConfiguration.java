package co.edu.unicauca.backend.recordsources.domain.model;

import java.util.List;
import lombok.Builder;

@Builder
public record ValidationConfiguration(long revision, List<ContextFields> contexts) {
    public enum Context { collection, permit, sampling, marine, other }

    @Builder
    public record ContextFields(Context context, List<String> requiredFields, List<String> optionalFields) {
        public static class ContextFieldsBuilder {
            private List<String> optionalFields = List.of();
        }
    }
}
