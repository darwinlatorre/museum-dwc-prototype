package co.edu.unicauca.backend.collections.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Page;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;

public interface CollectionStore {
    Page<Info> list(int page, int size);
    Info detail(UUID id);
    Info lock(UUID id);
    void create(Info collection);
    void advance(UUID id, long revision);
    Page<Record> records(UUID id, Trash trash, int page, int size);
    Record record(UUID collectionId, UUID recordId);
    boolean collision(Record candidate, UUID excludedId);
    void save(Record record);
    void insertRows(List<Record> records);
    Optional<Receipt> receipt(UUID key);
    void saveReceipt(Receipt receipt);
}
