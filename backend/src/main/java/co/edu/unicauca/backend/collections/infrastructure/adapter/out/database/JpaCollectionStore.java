package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import co.edu.unicauca.backend.collections.application.port.out.CollectionStore;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;
import co.edu.unicauca.backend.collections.domain.validation.CollectionIdentity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.BiologicalCollectionEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionRecordEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionImportEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper.CollectionJson;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper.CollectionPersistenceMapper;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.BiologicalCollectionRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionRecordRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionImportRepository;

@RequiredArgsConstructor
public final class JpaCollectionStore implements CollectionStore {
    private final BiologicalCollectionRepository collections;
    private final CollectionRecordRepository records;
    private final CollectionImportRepository imports;
    private final CollectionPersistenceMapper mapper;
    private final CollectionJson json;
    private final EntityManager entityManager;

    private Info info(BiologicalCollectionEntity entity) {
        return mapper.info(entity, records.countByCollectionIdAndTrashed(entity.getId(), false),
            records.countByCollectionIdAndTrashed(entity.getId(), true));
    }
    @Override public Page<Info> list(int page, int size) {
        var result = collections.findAll(PageRequest.of(page, size, Sort.by("id")));
        return new Page<>(result.stream().map(this::info).toList(), page, size, result.getTotalElements());
    }
    @Override public Info detail(UUID id) {
        return info(collections.findById(id).orElseThrow(() -> new CollectionFailure("NOT_FOUND")));
    }
    @Override public Info lock(UUID id) {
        return info(collections.lock(id).orElseThrow(() -> new CollectionFailure("NOT_FOUND")));
    }
    @Override public void create(Info source) {
        var entity = new BiologicalCollectionEntity(source.id());
        mapper.collection(source, entity);
        collections.saveAndFlush(entity);
    }
    @Override public void advance(UUID id, long revision) {
        var entity = collections.findById(id).orElseThrow(() -> new CollectionFailure("NOT_FOUND"));
        entity.setRevision(revision);
        collections.saveAndFlush(entity);
    }
    @Override public Page<Record> records(UUID id, Trash trash, int page, int size) {
        var paging = PageRequest.of(page, size, Sort.by("id"));
        var result = trash == Trash.ALL ? records.findByCollectionId(id, paging)
            : records.findByCollectionIdAndTrashed(id, trash == Trash.TRASHED, paging);
        return new Page<>(result.stream().map(row -> mapper.record(row, json)).toList(), page, size, result.getTotalElements());
    }
    @Override public Record record(UUID id, UUID recordId) {
        return mapper.record(records.findByCollectionIdAndId(id, recordId).orElseThrow(() -> new CollectionFailure("NOT_FOUND")), json);
    }
    @Override public boolean collision(Record row, UUID excludedId) {
        String occurrence = CollectionIdentity.occurrenceId(row.headers(), row.mapping(), row.values());
        return records.collisions(row.collectionId(), excludedId, CollectionIdentity.row(row.headers(), row.mapping(), row.values()),
            occurrence == null ? null : CollectionIdentity.hash(occurrence)) > 0;
    }
    @Override public void save(Record source) {
        String rowHash = CollectionIdentity.row(source.headers(), source.mapping(), source.values());
        String occurrence = CollectionIdentity.occurrenceId(source.headers(), source.mapping(), source.values());
        String occurrenceHash = occurrence == null ? null : CollectionIdentity.hash(occurrence);
        var existing = records.findById(source.id());
        if (existing.isPresent()) {
            mapper.update(source, rowHash, occurrenceHash, existing.get(), json);
            records.saveAndFlush(existing.get());
        } else {
            insert(source);
            entityManager.flush();
        }
    }
    @Override public void insertRows(List<Record> rows) {
        rows.forEach(this::insert);
        entityManager.flush();
    }
    private void insert(Record source) {
        String occurrence = CollectionIdentity.occurrenceId(source.headers(), source.mapping(), source.values());
        var entity = new CollectionRecordEntity(source.id());
        mapper.insert(source, CollectionIdentity.row(source.headers(), source.mapping(), source.values()),
            occurrence == null ? null : CollectionIdentity.hash(occurrence), entity, json);
        entityManager.persist(entity);
    }
    @Override public Optional<Receipt> receipt(UUID key) {
        return key == null ? Optional.empty() : imports.findById(key).map(mapper::receipt);
    }
    @Override public void saveReceipt(Receipt receipt) {
        var entity = new CollectionImportEntity(receipt.idempotencyKey());
        mapper.receipt(receipt, entity);
        imports.saveAndFlush(entity);
    }
}
