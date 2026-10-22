package co.edu.unicauca.backend;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;

@Component
public class ProfileBootstrap implements ApplicationRunner {
    private final ProfileService service;
    private final ObjectMapper json;

    public ProfileBootstrap(ProfileService service, ObjectMapper json) {
        this.service = service;
        this.json = json;
    }
    @Override
    public void run(ApplicationArguments arguments) throws IOException {
        initialize();
    }
    public void initialize() throws IOException {
        // Boot's Flyway initializer completes before the application runners execute.
        try (var input = new ClassPathResource("data/profiles.json").getInputStream()) {
            service.initialize(json.readValue(input, new TypeReference<List<Profile>>() {}));
        }
    }
}
