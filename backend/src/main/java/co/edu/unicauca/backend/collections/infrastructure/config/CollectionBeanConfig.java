package co.edu.unicauca.backend.collections.infrastructure.config;

import jakarta.persistence.EntityManager;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;
import co.edu.unicauca.backend.collections.application.port.in.CollectionOperations;
import co.edu.unicauca.backend.collections.application.service.CollectionService;
import co.edu.unicauca.backend.collections.domain.validation.CollectionValidator;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper.CollectionHttpMapper;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.CollectionBodyLimitFilter;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.JpaCollectionStore;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.JpaValidationAuthority;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper.CollectionJson;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper.CollectionPersistenceMapper;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.BiologicalCollectionRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionRecordRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionImportRepository;
import co.edu.unicauca.backend.collections.infrastructure.transaction.TransactionalCollectionOperations;

@Configuration
public class CollectionBeanConfig {
    @Bean CollectionBodyLimitFilter collectionBodyLimitFilter(ObjectMapper json) { return new CollectionBodyLimitFilter(json); }
    @Bean CollectionHttpMapper collectionHttpMapper() { return Mappers.getMapper(CollectionHttpMapper.class); }
    @Bean CollectionOperations collectionOperations(BiologicalCollectionRepository collections, CollectionRecordRepository records,
            CollectionImportRepository imports, EntityManager entityManager, ObjectMapper json) {
        var store = new JpaCollectionStore(collections, records, imports, Mappers.getMapper(CollectionPersistenceMapper.class), new CollectionJson(json), entityManager);
        var authority = new JpaValidationAuthority(entityManager, json);
        return new TransactionalCollectionOperations(new CollectionService(store, authority, new CollectionValidator()));
    }
}
