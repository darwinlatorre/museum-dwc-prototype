package co.edu.unicauca.backend.profile.infrastructure.adapter.json.mapper;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import java.util.List;
import org.mapstruct.Mapper;

/** Conversiones estructurales; los null siguen llegando a la validación del dominio. */
@Mapper(config = BackendMapperConfig.class)
public interface ProfileJsonMapper {
    Profile.Rule toDomain(ProfileJson.Rule rule);

    Profile toDomain(ProfileJson.Seed seed);

    List<Profile.Rule> toDomainRules(List<ProfileJson.Rule> rules);
}
