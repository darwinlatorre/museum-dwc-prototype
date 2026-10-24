package co.edu.unicauca.backend.profile.configuration;

import co.edu.unicauca.backend.profile.adapter.in.http.ProfileHttpMapper;
import co.edu.unicauca.backend.profile.adapter.out.persistence.JpaProfileStore;
import co.edu.unicauca.backend.profile.adapter.out.persistence.ProfilePersistenceMapper;
import co.edu.unicauca.backend.profile.adapter.out.persistence.ProfileRepository;
import co.edu.unicauca.backend.profile.application.port.in.ProfileLifecycle;
import co.edu.unicauca.backend.profile.application.port.out.ProfileStore;
import co.edu.unicauca.backend.profile.application.usecase.ProfileService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class ProfileConfiguration {
    @Bean
    ProfilePersistenceMapper profilePersistenceMapper(ObjectMapper json) {
        return new ProfilePersistenceMapper(json);
    }

    @Bean
    ProfileHttpMapper profileHttpMapper() {
        return new ProfileHttpMapper();
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
