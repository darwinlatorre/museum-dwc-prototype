package co.edu.unicauca.backend.profile.adapter.in.http.dto.res;

import co.edu.unicauca.backend.profile.domain.Profile;
import java.util.List;

public record ProfileResponse(String id, String name, String version, Profile.Status status, long revision,
                              String description, List<RuleResponse> rules) {}
