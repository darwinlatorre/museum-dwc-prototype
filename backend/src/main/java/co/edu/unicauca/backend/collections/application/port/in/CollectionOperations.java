package co.edu.unicauca.backend.collections.application.port.in;

import java.util.UUID;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;

public interface CollectionOperations {
    Page<Info> list(int page, int size);
    Info detail(UUID collectionId);
    Page<Record> records(UUID collectionId, Trash trash, int page, int size);
    Record record(UUID collectionId, UUID recordId);
    Receipt importRows(CollectionCommands.Import command);
    Info add(UUID collectionId, CollectionCommands.Add command);
    Info edit(UUID collectionId, UUID recordId, CollectionCommands.Edit command);
    Info trash(UUID collectionId, UUID recordId, long expectedRevision);
    Info restore(UUID collectionId, UUID recordId, CollectionCommands.Restore command);
}
