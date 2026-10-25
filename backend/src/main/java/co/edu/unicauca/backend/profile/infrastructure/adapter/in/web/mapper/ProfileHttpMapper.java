package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.RuleRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.RuleResponse;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class)
public interface ProfileHttpMapper {
    Profile.Content toContent(CreateProfileRequest request);

    Profile.Content toContent(UpdateProfileRequest request);

    Profile.Rule toRule(RuleRequest request);

    ProfileResponse toResponse(Profile profile);

    RuleResponse toResponse(Profile.Rule rule);
}
