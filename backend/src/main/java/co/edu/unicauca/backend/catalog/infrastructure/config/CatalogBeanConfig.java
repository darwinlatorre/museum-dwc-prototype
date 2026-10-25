package co.edu.unicauca.backend.catalog.infrastructure.config;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper.CatalogHttpMapper;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.service.CatalogWebService;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.mapper.CatalogPersistenceMapper;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.bootstrap.CatalogBootstrap;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.scheduling.CatalogRefresh;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.repository.CatalogRepository;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.CatalogStore;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg.CatalogParser;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg.CatalogSource;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg.TdwgCatalogSource;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg.TdwgSource;
import co.edu.unicauca.backend.catalog.application.port.out.CatalogCandidateSource;
import co.edu.unicauca.backend.catalog.application.service.CatalogUseCase;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import tools.jackson.databind.ObjectMapper;
import java.time.Clock;

@Configuration
public class CatalogBeanConfig {
    @Bean Clock catalogClock() { return Clock.systemUTC(); }
    @Bean CatalogSource tdwgSource(ObjectMapper json) { return new TdwgSource(json); }
    @Bean CatalogParser catalogParser(ObjectMapper json) { return new CatalogParser(json); }
    @Bean CatalogCandidateSource catalogCandidateSource(CatalogSource source, CatalogParser parser) {
        return new TdwgCatalogSource(source, parser);
    }
    @Bean CatalogHttpMapper catalogHttpMapper() { return new CatalogHttpMapper(); }
    @Bean CatalogWebService catalogWebService(CatalogOperations operations, CatalogHttpMapper mapper) {
        return new CatalogWebService(operations, mapper);
    }
    @Bean CatalogPersistenceMapper catalogPersistenceMapper(ObjectMapper json) {
        return new CatalogPersistenceMapper(json);
    }
    @Bean CatalogStore catalogStore(CatalogRepository repository, CatalogPersistenceMapper mapper, Clock clock) {
        return new CatalogStore(repository, mapper, clock);
    }
    @Bean CatalogRefresh catalogRefresh(CatalogCandidateSource source, CatalogStore store) {
        return new CatalogRefresh(new CatalogUseCase(source, store));
    }
    @Bean ApplicationRunner catalogBootstrap(CatalogStore store) { return new CatalogBootstrap(store); }

    @Configuration
    @EnableScheduling
    @ConditionalOnProperty(name = "catalog.sync.enabled", havingValue = "true", matchIfMissing = true)
    static class SchedulingBeanConfig {}
}
