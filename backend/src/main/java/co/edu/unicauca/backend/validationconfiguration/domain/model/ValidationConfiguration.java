package co.edu.unicauca.backend.validationconfiguration.domain.model;

import java.util.List;
import lombok.Builder;

@Builder(toBuilder = true)
public record ValidationConfiguration(long revision, List<ContextFields> contexts) {
    public enum Context { collection, permit, sampling, marine, other }

    @Builder
    public record ContextFields(Context context, List<String> requiredFields) {}
}
