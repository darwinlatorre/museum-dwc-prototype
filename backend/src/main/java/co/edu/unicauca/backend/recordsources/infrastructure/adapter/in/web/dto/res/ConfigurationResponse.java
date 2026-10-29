package co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.res;

import java.util.List;

public record ConfigurationResponse(long revision, List<ContextResponse> contexts) {
    public record ContextResponse(String context, List<String> requiredFields, List<String> optionalFields) {}
}
