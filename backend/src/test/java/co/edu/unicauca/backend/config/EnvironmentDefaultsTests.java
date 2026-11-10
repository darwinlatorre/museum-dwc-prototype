package co.edu.unicauca.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SimpleCommandLinePropertySource;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EnvironmentDefaultsTests {

    @Test
    void defaultsUseLocalhostAndStandardPortsWithoutDevelopmentCredentials() throws IOException {
        var environment = environment(Map.of("DB_NAME", "fixture", "DB_USER", "test-user", "DB_PASSWORD", "test-password"));
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/fixture");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("test-user");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("test-password");
        assertThat(environment.getProperty("server.port")).isEqualTo("8080");
        assertThat(environment.getProperty("server.address")).isEqualTo("127.0.0.1");
    }

    @Test
    void explicitHostPortsAndNativeSpringAddressOverrideRemainSupported() throws IOException {
        var environment = environment(Map.of("DB_HOST", "museum-db", "DB_PORT", "15432",
                "DB_NAME", "other", "SERVER_PORT", "18080", "SERVER_ADDRESS", "0.0.0.0"));
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://museum-db:15432/other");
        assertThat(environment.getProperty("server.port")).isEqualTo("18080");
        assertThat(environment.getProperty("server.address")).isEqualTo("0.0.0.0");
    }

    @Test
    void yamlBindingIsLiteralWithoutAnExplicitEnvironmentPlaceholder() throws IOException {
        var sources = new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yaml"));
        assertThat(sources.getFirst().getProperty("server.address")).isEqualTo("127.0.0.1");
    }

    @Test
    void corsDefaultsAndEnvironmentOverrideRemainSupported() throws IOException {
        assertThat(environment(Map.of()).getProperty("cors.allowed-origins"))
                .isEqualTo("http://localhost:4200,http://localhost:8081,http://localhost,http://127.0.0.1:4200,http://127.0.0.1:8081,http://127.0.0.1");
        var origins = "http://localhost:14200,http://127.0.0.1:14200";
        assertThat(environment(Map.of("CORS_ALLOWED_ORIGINS", origins)).getProperty("cors.allowed-origins"))
                .isEqualTo(origins);
    }

    @Test
    void containerCommandLineOverridesLocalBindingWithoutChangingPortOrCors() throws IOException {
        var environment = environment(Map.of("SERVER_PORT", "18080", "CORS_ALLOWED_ORIGINS", "http://localhost:14200"));
        environment.getPropertySources().addFirst(new SimpleCommandLinePropertySource("--server.address=0.0.0.0"));
        assertThat(environment.getProperty("server.address")).isEqualTo("0.0.0.0");
        assertThat(environment.getProperty("server.port")).isEqualTo("18080");
        assertThat(environment.getProperty("cors.allowed-origins")).isEqualTo("http://localhost:14200");
    }

    @Test
    void advancedJdbcUrlAndIntegrationPropertyOverridesRemainSupported() throws IOException {
        var environment = environment(Map.of("DB_URL", "jdbc:postgresql://advanced:6432/custom"));
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://advanced:6432/custom");
        environment.getPropertySources().addFirst(new MapPropertySource("dynamic-test-properties",
                Map.of("spring.datasource.url", "jdbc:postgresql://testcontainer:32768/test")));
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://testcontainer:32768/test");
    }

    private StandardEnvironment environment(Map<String, Object> properties) throws IOException {
        var environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource("controlled", properties));
        for (var source : new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yaml"))) {
            environment.getPropertySources().addLast(source);
        }
        return environment;
    }
}
