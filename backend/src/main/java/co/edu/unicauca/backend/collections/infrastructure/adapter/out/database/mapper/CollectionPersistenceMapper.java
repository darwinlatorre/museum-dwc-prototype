package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.BiologicalCollectionEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionRecordEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionImportEntity;

@Mapper(config = BackendMapperConfig.class)
public interface CollectionPersistenceMapper {
    @Mapping(target = "id", ignore = true)
    void collection(Info source, @MappingTarget BiologicalCollectionEntity target);
    Info info(BiologicalCollectionEntity source, long activeCount, long trashCount);

    @Mapping(target = "id", ignore = true)
    void insert(Record source, String rowHash, String occurrenceHash, @MappingTarget CollectionRecordEntity target);

    // Originals, provenance and identity are immutable after insert.
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "collectionId", ignore = true)
    @Mapping(target = "headers", ignore = true)
    @Mapping(target = "mapping", ignore = true)
    @Mapping(target = "originalValues", ignore = true)
    @Mapping(target = "sourceRow", ignore = true)
    @Mapping(target = "importKey", ignore = true)
    void update(Record source, String rowHash, String occurrenceHash, @MappingTarget CollectionRecordEntity target);

    Record record(CollectionRecordEntity source);

    Receipt receipt(CollectionImportEntity source);
    @Mapping(target = "idempotencyKey", ignore = true)
    void receipt(Receipt source, @MappingTarget CollectionImportEntity target);
}
