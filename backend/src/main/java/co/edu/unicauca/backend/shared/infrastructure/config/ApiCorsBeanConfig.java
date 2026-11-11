package co.edu.unicauca.backend.shared.infrastructure.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class ApiCorsBeanConfig implements WebMvcConfigurer {
    private final String[] allowedOrigins;

    public ApiCorsBeanConfig(@Value("${cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins).map(String::trim).toArray(String[]::new);
        if (List.of(this.allowedOrigins).contains("*")) {
            throw new IllegalArgumentException("CORS_ALLOWED_ORIGINS no admite el origen comodín *.");
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "HEAD", "POST", "PUT")
            .allowedHeaders("Content-Type")
            .allowCredentials(false);
    }
}
