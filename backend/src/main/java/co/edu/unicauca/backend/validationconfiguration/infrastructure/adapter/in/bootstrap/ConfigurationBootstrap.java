package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.bootstrap;

import co.edu.unicauca.backend.validationconfiguration.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class ConfigurationBootstrap implements ApplicationRunner {
    private final ConfigurationOperations operations;
    private final ConfigurationJsonMapper mapper;
    private final ObjectMapper json;

    @Override public void run(ApplicationArguments args) throws IOException { initialize(); }
    public void initialize() throws IOException {
        try (var input = new ClassPathResource("data/validation-configuration.json").getInputStream()) {
            operations.initialize(mapper.toDomain(json.readValue(input, ConfigurationJson.class)));
        }
    }
}
