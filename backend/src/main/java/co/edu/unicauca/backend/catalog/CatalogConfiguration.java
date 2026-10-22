package co.edu.unicauca.backend.catalog;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.time.Clock;

@Configuration
class CatalogConfiguration {
    @Bean Clock catalogClock() { return Clock.systemUTC(); }
    @Bean ApplicationRunner catalogBootstrap(CatalogStore store) { return arguments -> store.initialize(); }

    @Configuration
    @EnableScheduling
    @ConditionalOnProperty(name = "catalog.sync.enabled", havingValue = "true", matchIfMissing = true)
    static class Scheduling {}
}
