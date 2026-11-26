package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import co.edu.unicauca.backend.collections.application.port.out.CollectionStore;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure.Code;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;
import co.edu.unicauca.backend.collections.domain.model.RecordOrder;
import co.edu.unicauca.backend.collections.domain.validation.CollectionIdentity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.BiologicalCollectionEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionImportEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionRecordEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper.CollectionPersistenceMapper;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.BiologicalCollectionRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionImportRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionRecordRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionRecordRepository.Counts;

/** Writes flush inside the caller's transaction so constraint failures surface before the receipt. */
@RequiredArgsConstructor
public final class JpaCollectionStore implements CollectionStore {
    private final BiologicalCollectionRepository collections;
    private final CollectionRecordRepository records;
    private final CollectionImportRepository imports;
    private final CollectionPersistenceMapper mapper;

    @Override public Page<Info> list(int page, int size) {
        var result = collections.findAll(PageRequest.of(page, size, Sort.by("id")));
        return new Page<>(infos(result.getContent()), page, size, result.getTotalElements());
    }
    @Override public Info detail(UUID id) { return info(collections.findById(id)); }
    @Override public Info lock(UUID id) { return info(collections.lock(id)); }
    @Override public void create(Info source) {
        var entity = new BiologicalCollectionEntity(source.id());
        mapper.collection(source, entity);
        collections.saveAndFlush(entity);
    }
    @Override public void advance(UUID id, long revision) {
        collections.findById(id).orElseThrow(() -> new CollectionFailure(Code.NOT_FOUND)).setRevision(revision);
        collections.flush();
    }
    @Override public Page<Record> records(UUID id, Trash trash, int page, int size, RecordOrder order) {
        var result = records.sorted(id, trash == Trash.ALL, trash == Trash.TRASHED,
            order.field() == null ? "" : order.field(), order.field() == null,
            order.direction() == RecordOrder.Direction.ASC, PageRequest.of(page, size));
        return new Page<>(result.stream().map(mapper::record).toList(), page, size, result.getTotalElements());
    }
    @Override public Record record(UUID id, UUID recordId) {
        return mapper.record(records.findByCollectionIdAndId(id, recordId).orElseThrow(() -> new CollectionFailure(Code.NOT_FOUND)));
    }
    @Override public boolean collision(Record row, UUID excludedId) {
        return records.collisions(row.collectionId(), excludedId, rowHash(row), occurrenceHash(row)) > 0;
    }
    @Override public void update(Record source) {
        var entity = records.findById(source.id()).orElseThrow(() -> new CollectionFailure(Code.NOT_FOUND));
        mapper.update(source, rowHash(source), occurrenceHash(source), entity);
        records.flush();
    }
    @Override public void insertRows(List<Record> rows) {
        records.saveAllAndFlush(rows.stream().map(source -> {
            var entity = new CollectionRecordEntity(source.id());
            mapper.insert(source, rowHash(source), occurrenceHash(source), entity);
            return entity;
        }).toList());
    }
    @Override public Optional<Receipt> receipt(UUID key) {
        return key == null ? Optional.empty() : imports.findById(key).map(mapper::receipt);
    }
    @Override public void saveReceipt(Receipt receipt) {
        var entity = new CollectionImportEntity(receipt.idempotencyKey());
        mapper.receipt(receipt, entity);
        imports.saveAndFlush(entity);
    }

    private Info info(Optional<BiologicalCollectionEntity> entity) {
        return infos(List.of(entity.orElseThrow(() -> new CollectionFailure(Code.NOT_FOUND)))).getFirst();
    }
    private List<Info> infos(List<BiologicalCollectionEntity> entities) {
        if (entities.isEmpty()) return List.of();
        Map<UUID, Counts> counts = records.countsByCollection(entities.stream().map(BiologicalCollectionEntity::getId).toList())
            .stream().collect(Collectors.toMap(Counts::getCollectionId, Function.identity()));
        return entities.stream().map(entity -> {
            var count = counts.get(entity.getId());
            return mapper.info(entity, count == null ? 0 : count.getActive(), count == null ? 0 : count.getTrashed());
        }).toList();
    }
    private static String rowHash(Record row) {
        return CollectionIdentity.row(row.headers(), row.mapping(), row.values());
    }
    private static String occurrenceHash(Record row) {
        String occurrence = CollectionIdentity.occurrenceId(row.headers(), row.mapping(), row.values());
        return occurrence == null ? null : CollectionIdentity.hash(occurrence);
    }
}
