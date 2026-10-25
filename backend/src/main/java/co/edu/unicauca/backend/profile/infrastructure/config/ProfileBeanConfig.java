package co.edu.unicauca.backend.profile.infrastructure.config;

import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.mapper.ProfileHttpMapper;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.service.ProfileWebService;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.JpaProfileStore;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper.ProfilePersistenceMapper;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.repository.ProfileRepository;
import co.edu.unicauca.backend.profile.infrastructure.transaction.TransactionalProfileLifecycle;
import co.edu.unicauca.backend.profile.application.port.in.ProfileLifecycle;
import co.edu.unicauca.backend.profile.application.port.out.ProfileStore;
import co.edu.unicauca.backend.profile.application.service.ProfileService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class ProfileBeanConfig {
    @Bean
    ProfilePersistenceMapper profilePersistenceMapper(ObjectMapper json) {
        return new ProfilePersistenceMapper(json);
    }

    @Bean
    ProfileHttpMapper profileHttpMapper() {
        return new ProfileHttpMapper();
    }

    @Bean
    ProfileWebService profileWebService(ProfileLifecycle lifecycle, ProfileHttpMapper mapper) {
        return new ProfileWebService(lifecycle, mapper);
    }

    @Bean
    ProfileStore profileStore(ProfileRepository repository, ProfilePersistenceMapper mapper) {
        return new JpaProfileStore(repository, mapper);
    }

    @Bean
    ProfileLifecycle profileLifecycle(ProfileStore store) {
        return new TransactionalProfileLifecycle(new ProfileService(store));
    }
}
