package co.edu.unicauca.backend.collections.infrastructure.transaction;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import co.edu.unicauca.backend.collections.application.port.in.CollectionCommands;
import co.edu.unicauca.backend.collections.application.port.in.CollectionOperations;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;

@RequiredArgsConstructor
public class TransactionalCollectionOperations implements CollectionOperations {
    private final CollectionOperations delegate;
    @Override @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Page<Info> list(int page, int size) { return delegate.list(page, size); }
    @Override @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Info detail(UUID id) { return delegate.detail(id); }
    @Override @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Page<Record> records(UUID id, Trash trash, int page, int size) { return delegate.records(id, trash, page, size); }
    @Override @Transactional(readOnly = true)
    public Record record(UUID id, UUID recordId) { return delegate.record(id, recordId); }
    @Override @Transactional
    public Receipt importRows(CollectionCommands.Import command) { return delegate.importRows(command); }
    @Override @Transactional
    public Info add(UUID id, CollectionCommands.Add command) { return delegate.add(id, command); }
    @Override @Transactional
    public Info edit(UUID id, UUID recordId, CollectionCommands.Edit command) { return delegate.edit(id, recordId, command); }
    @Override @Transactional
    public Info trash(UUID id, UUID recordId, long revision) { return delegate.trash(id, recordId, revision); }
    @Override @Transactional
    public Info restore(UUID id, UUID recordId, CollectionCommands.Restore command) { return delegate.restore(id, recordId, command); }
}
