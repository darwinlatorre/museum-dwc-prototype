package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper;

import org.mapstruct.Context;
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
    @Mapping(target = "headers", expression = "java(json.encode(source.headers()))")
    @Mapping(target = "mapping", expression = "java(json.encode(source.mapping()))")
    @Mapping(target = "originalValues", expression = "java(json.encode(source.originalValues()))")
    @Mapping(target = "values", expression = "java(json.encode(source.values()))")
    void insert(Record source, String rowHash, String occurrenceHash, @MappingTarget CollectionRecordEntity target, @Context CollectionJson json);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "collectionId", ignore = true)
    @Mapping(target = "headers", ignore = true)
    @Mapping(target = "mapping", ignore = true)
    @Mapping(target = "originalValues", ignore = true)
    @Mapping(target = "sourceRow", ignore = true)
    @Mapping(target = "importKey", ignore = true)
    @Mapping(target = "values", expression = "java(json.encode(source.values()))")
    void update(Record source, String rowHash, String occurrenceHash, @MappingTarget CollectionRecordEntity target, @Context CollectionJson json);

    @Mapping(target = "headers", expression = "java(json.strings(source.getHeaders()))")
    @Mapping(target = "mapping", expression = "java(json.mapping(source.getMapping()))")
    @Mapping(target = "originalValues", expression = "java(json.strings(source.getOriginalValues()))")
    @Mapping(target = "values", expression = "java(json.strings(source.getValues()))")
    Record record(CollectionRecordEntity source, @Context CollectionJson json);

    Receipt receipt(CollectionImportEntity source);
    @Mapping(target = "idempotencyKey", ignore = true)
    void receipt(Receipt source, @MappingTarget CollectionImportEntity target);
}
