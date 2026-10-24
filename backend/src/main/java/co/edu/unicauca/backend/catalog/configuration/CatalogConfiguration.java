package co.edu.unicauca.backend.catalog.configuration;

import co.edu.unicauca.backend.catalog.adapter.in.bootstrap.CatalogBootstrap;
import co.edu.unicauca.backend.catalog.adapter.in.scheduling.CatalogRefresh;
import co.edu.unicauca.backend.catalog.adapter.out.persistence.CatalogRepository;
import co.edu.unicauca.backend.catalog.adapter.out.persistence.CatalogStore;
import co.edu.unicauca.backend.catalog.adapter.out.tdwg.CatalogParser;
import co.edu.unicauca.backend.catalog.adapter.out.tdwg.CatalogSource;
import co.edu.unicauca.backend.catalog.adapter.out.tdwg.TdwgCatalogSource;
import co.edu.unicauca.backend.catalog.adapter.out.tdwg.TdwgSource;
import co.edu.unicauca.backend.catalog.application.port.out.CatalogCandidateSource;
import co.edu.unicauca.backend.catalog.application.usecase.CatalogUseCase;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import tools.jackson.databind.ObjectMapper;
import java.time.Clock;

@Configuration
public class CatalogConfiguration {
    @Bean Clock catalogClock() { return Clock.systemUTC(); }
    @Bean CatalogSource tdwgSource(ObjectMapper json) { return new TdwgSource(json); }
    @Bean CatalogParser catalogParser(ObjectMapper json) { return new CatalogParser(json); }
    @Bean CatalogCandidateSource catalogCandidateSource(CatalogSource source, CatalogParser parser) {
        return new TdwgCatalogSource(source, parser);
    }
    @Bean CatalogStore catalogStore(CatalogRepository repository, ObjectMapper json, Clock clock) {
        return new CatalogStore(repository, json, clock);
    }
    @Bean CatalogRefresh catalogRefresh(CatalogCandidateSource source, CatalogStore store) {
        return new CatalogRefresh(new CatalogUseCase(source, store));
    }
    @Bean ApplicationRunner catalogBootstrap(CatalogStore store) { return new CatalogBootstrap(store); }

    @Configuration
    @EnableScheduling
    @ConditionalOnProperty(name = "catalog.sync.enabled", havingValue = "true", matchIfMissing = true)
    static class Scheduling {}
}
