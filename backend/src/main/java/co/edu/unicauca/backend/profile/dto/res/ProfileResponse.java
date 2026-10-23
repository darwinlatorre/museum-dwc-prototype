package co.edu.unicauca.backend.profile.dto.res;

import co.edu.unicauca.backend.profile.Profile;
import java.util.List;

public record ProfileResponse(String id, String name, String version, Profile.Status status, long revision,
                              String description, List<RuleResponse> rules) {}
