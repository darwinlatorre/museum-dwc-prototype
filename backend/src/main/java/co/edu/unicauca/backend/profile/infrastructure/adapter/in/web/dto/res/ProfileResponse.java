package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res;

import java.util.List;
import lombok.Builder;

@Builder
public record ProfileResponse(String id, String name, String version, String status, long revision,
                              String description, List<RuleResponse> rules) {}
