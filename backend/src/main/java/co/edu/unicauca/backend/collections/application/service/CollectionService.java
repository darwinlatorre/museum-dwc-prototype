package co.edu.unicauca.backend.collections.application.service;

import java.util.HashSet;
import java.util.List;
import java.util.TreeMap;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import co.edu.unicauca.backend.collections.application.port.in.CollectionCommands;
import co.edu.unicauca.backend.collections.application.port.in.CollectionOperations;
import co.edu.unicauca.backend.collections.application.port.out.CollectionStore;
import co.edu.unicauca.backend.collections.application.port.out.ValidationAuthority;
import co.edu.unicauca.backend.collections.application.port.out.ValidationAuthority.Snapshot;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;
import co.edu.unicauca.backend.collections.domain.validation.CollectionIdentity;
import co.edu.unicauca.backend.collections.domain.validation.CollectionValidator;

@RequiredArgsConstructor
public final class CollectionService implements CollectionOperations {
    private final CollectionStore store;
    private final ValidationAuthority authority;
    private final CollectionValidator validator;

    @Override public Page<Info> list(int page, int size) { paging(page, size); return store.list(page, size); }
    @Override public Info detail(UUID id) { return store.detail(id); }
    @Override public Page<Record> records(UUID id, Trash trash, int page, int size) {
        paging(page, size); store.detail(id); return store.records(id, trash, page, size);
    }
    @Override public Record record(UUID id, UUID recordId) { return store.record(id, recordId); }
    private static void paging(int page, int size) {
        if (page < 0 || size < 1 || size > 200 || (long) page * size > Integer.MAX_VALUE) throw new CollectionFailure("INVALID_PAGING");
    }
    private static void snapshots(Snapshot snapshot, long configurationRevision, long catalogVersion) {
        if (configurationRevision < 0 || catalogVersion < 0) throw new CollectionFailure("INVALID_REQUEST");
        if (snapshot.configurationRevision() != configurationRevision) throw new CollectionFailure("CONFIGURATION_CHANGED");
        if (snapshot.catalogVersion() != catalogVersion) throw new CollectionFailure("CATALOG_CHANGED");
    }
    private Info current(UUID id, long expectedRevision) {
        Info info = store.lock(id);
        if (expectedRevision < 0 || info.revision() != expectedRevision) throw new CollectionFailure("REVISION_CONFLICT");
        return info;
    }
    @Override public Receipt importRows(CollectionCommands.Import command) {
        Snapshot snapshot = authority.lockCurrent();
        String identity = identity(command);
        var previous = store.receipt(command.idempotencyKey());
        if (previous.isPresent()) {
            if (!previous.get().identity().equals(identity)) throw new CollectionFailure("IDEMPOTENCY_CONFLICT");
            return previous.get(); // Replay of committed work is not a new validation or write.
        }
        snapshots(snapshot, command.configurationRevision(), command.catalogVersion());
        if (command.idempotencyKey() == null || command.context() == null || !snapshot.requiredFields().containsKey(command.context()))
            throw new CollectionFailure("INVALID_REQUEST");
        Info collection;
        if (command.collectionId() == null) {
            if (command.expectedRevision() != null || !CollectionValidator.text(command.name(), 200) || CollectionValidator.blank(command.name()))
                throw new CollectionFailure("INVALID_REQUEST");
            collection = new Info(UUID.randomUUID(), command.name(), command.context(), 0, 0, 0);
        } else {
            if (command.name() != null || command.expectedRevision() == null) throw new CollectionFailure("INVALID_REQUEST");
            collection = current(command.collectionId(), command.expectedRevision());
            if (!collection.context().equals(command.context())) throw new CollectionFailure("CONTEXT_CONFLICT");
        }
        validate(command.headers(), command.mapping(), command.rows(), collection, snapshot, command.warningsConfirmed());
        var rows = command.rows().stream().map(row -> candidate(collection.id(), command.headers(), command.mapping(), row,
            command.idempotencyKey(), snapshot)).toList();
        var equalRows = new HashSet<String>();
        var ids = new HashSet<String>();
        for (Record row : rows) {
            String full = CollectionIdentity.row(row.headers(), row.mapping(), row.values());
            String occurrenceId = CollectionIdentity.occurrenceId(row.headers(), row.mapping(), row.values());
            if (!equalRows.add(full) || (occurrenceId != null && !ids.add(occurrenceId))
                    || (command.collectionId() != null && store.collision(row, null))) throw new CollectionFailure("DUPLICATE");
        }
        if (command.collectionId() == null) store.create(collection);
        store.insertRows(rows);
        store.advance(collection.id(), Math.addExact(collection.revision(), 1));
        var receipt = new Receipt(command.idempotencyKey(), identity, collection.id(), Math.addExact(collection.revision(), 1), rows.size());
        store.saveReceipt(receipt);
        return receipt;
    }
    @Override public Info add(UUID id, CollectionCommands.Add command) {
        var snapshot = authority.lockCurrent();
        snapshots(snapshot, command.configurationRevision(), command.catalogVersion());
        var collection = current(id, command.expectedRevision());
        validate(command.headers(), command.mapping(), List.of(command.row()), collection, snapshot, command.warningsConfirmed());
        var row = candidate(id, command.headers(), command.mapping(), command.row(), null, snapshot);
        if (store.collision(row, null)) throw new CollectionFailure("DUPLICATE");
        store.save(row);
        return advance(collection);
    }
    @Override public Info edit(UUID id, UUID recordId, CollectionCommands.Edit command) {
        var snapshot = authority.lockCurrent();
        snapshots(snapshot, command.configurationRevision(), command.catalogVersion());
        var collection = current(id, command.expectedRevision());
        var old = store.record(id, recordId);
        if (old.trashed()) throw new CollectionFailure("RECORD_TRASHED");
        var row = new Row(old.sourceRow(), old.originalValues(), command.values());
        validate(old.headers(), old.mapping(), List.of(row), collection, snapshot, command.warningsConfirmed());
        var updated = new Record(old.id(), id, old.headers(), old.mapping(), old.sourceRow(), old.originalValues(),
            row.values(), old.importKey(), snapshot.configurationRevision(), snapshot.catalogVersion(), false);
        if (store.collision(updated, old.id())) throw new CollectionFailure("DUPLICATE");
        store.save(updated);
        return advance(collection);
    }
    @Override public Info trash(UUID id, UUID recordId, long expectedRevision) {
        // Same global lock ordering as other mutations; trash itself needs no validation consent.
        authority.lockCurrent();
        var collection = current(id, expectedRevision);
        var row = store.record(id, recordId);
        if (row.trashed()) throw new CollectionFailure("RECORD_TRASHED");
        store.save(new Record(row.id(), id, row.headers(), row.mapping(), row.sourceRow(), row.originalValues(), row.values(),
            row.importKey(), row.configurationRevision(), row.catalogVersion(), true));
        return advance(collection);
    }
    @Override public Info restore(UUID id, UUID recordId, CollectionCommands.Restore command) {
        var snapshot = authority.lockCurrent();
        snapshots(snapshot, command.configurationRevision(), command.catalogVersion());
        var collection = current(id, command.expectedRevision());
        var row = store.record(id, recordId);
        if (!row.trashed()) throw new CollectionFailure("RECORD_ACTIVE");
        validate(row.headers(), row.mapping(), List.of(new Row(row.sourceRow(), row.originalValues(), row.values())),
            collection, snapshot, command.warningsConfirmed());
        var restored = new Record(row.id(), id, row.headers(), row.mapping(), row.sourceRow(), row.originalValues(), row.values(),
            row.importKey(), snapshot.configurationRevision(), snapshot.catalogVersion(), false);
        if (store.collision(restored, row.id())) throw new CollectionFailure("DUPLICATE");
        store.save(restored);
        return advance(collection);
    }
    private Info advance(Info collection) {
        store.advance(collection.id(), Math.addExact(collection.revision(), 1));
        return store.detail(collection.id());
    }
    private void validate(List<String> headers, java.util.Map<String, String> mapping, List<Row> rows,
            Info collection, Snapshot snapshot, boolean confirmed) {
        var required = snapshot.requiredFields().get(collection.context());
        if (required == null) throw new CollectionFailure("INVALID_REQUEST");
        var issues = validator.validate(headers, mapping, rows, required, snapshot.termNames(), collection.context(), snapshot.configurationRevision());
        if (issues.stream().anyMatch(issue -> issue.severity().equals("ERROR"))) throw new CollectionFailure("VALIDATION_FAILED", issues);
        if (!confirmed && !issues.isEmpty()) throw new CollectionFailure("WARNINGS_UNCONFIRMED", issues);
    }
    private Record candidate(UUID id, List<String> headers, java.util.Map<String, String> mapping, Row row, UUID key, Snapshot snapshot) {
        return new Record(UUID.randomUUID(), id, headers, mapping, row.sourceRow(), row.originalValues(), row.values(), key,
            snapshot.configurationRevision(), snapshot.catalogVersion(), false);
    }
    private static String identity(CollectionCommands.Import command) {
        var result = new StringBuilder();
        CollectionIdentity.append(result, command.collectionId());
        CollectionIdentity.append(result, command.name());
        CollectionIdentity.append(result, command.context());
        CollectionIdentity.append(result, command.expectedRevision());
        CollectionIdentity.append(result, command.configurationRevision());
        CollectionIdentity.append(result, command.catalogVersion());
        CollectionIdentity.append(result, command.warningsConfirmed());
        CollectionIdentity.append(result, command.headers().size());
        command.headers().forEach(value -> CollectionIdentity.append(result, value));
        CollectionIdentity.append(result, command.mapping().size());
        new TreeMap<>(command.mapping()).forEach((key, value) -> {
            CollectionIdentity.append(result, key); CollectionIdentity.append(result, value);
        });
        CollectionIdentity.append(result, command.rows().size());
        for (Row row : command.rows()) {
            CollectionIdentity.append(result, row.sourceRow());
            CollectionIdentity.append(result, row.originalValues().size());
            row.originalValues().forEach(value -> CollectionIdentity.append(result, value));
            CollectionIdentity.append(result, row.values().size());
            row.values().forEach(value -> CollectionIdentity.append(result, value));
        }
        return CollectionIdentity.hash(result.toString());
    }
}
