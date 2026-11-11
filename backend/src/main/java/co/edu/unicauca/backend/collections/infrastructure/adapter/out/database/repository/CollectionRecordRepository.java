package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionRecordEntity;

public interface CollectionRecordRepository extends JpaRepository<CollectionRecordEntity, UUID> {
    Page<CollectionRecordEntity> findByCollectionId(UUID id, Pageable page);
    Page<CollectionRecordEntity> findByCollectionIdAndTrashed(UUID id, boolean trashed, Pageable page);
    Optional<CollectionRecordEntity> findByCollectionIdAndId(UUID collectionId, UUID id);
    long countByCollectionIdAndTrashed(UUID id, boolean trashed);
    @Query("select count(r) from CollectionRecordEntity r where r.collectionId = :collectionId and r.trashed = false "
        + "and (:excluded is null or r.id <> :excluded) and (r.rowHash = :rowHash or (:occurrenceHash is not null and r.occurrenceHash = :occurrenceHash))")
    long collisions(UUID collectionId, UUID excluded, String rowHash, String occurrenceHash);
}
