package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionRecordEntity;

public interface CollectionRecordRepository extends JpaRepository<CollectionRecordEntity, UUID> {
    // Only bound values control this fixed query. JSONB lookup follows effectiveField without normalization.
    @Query(value = """
        select r.* from collection_record r
        left join lateral (
            select nullif(r.row_values ->> cast(h.position - 1 as integer), '') as value
            from jsonb_array_elements_text(r.headers) with ordinality as h(header, position)
            where coalesce(nullif(r.mapping ->> h.header, ''), h.header) = :field
            limit 1
        ) cell on true
        where r.collection_id = :id and (:allRows or r.trashed = :trashed)
        order by
            case when :byRow and :ascending then r.source_row end asc,
            case when :byRow and not :ascending then r.source_row end desc,
            (case when not :byRow and :ascending then cell.value end) collate "C" asc nulls last,
            (case when not :byRow and not :ascending then cell.value end) collate "C" desc nulls last,
            r.source_row asc, r.id asc
        """, countQuery = """
        select count(*) from collection_record r
        where r.collection_id = :id and (:allRows or r.trashed = :trashed)
        """, nativeQuery = true)
    Page<CollectionRecordEntity> sorted(UUID id, boolean allRows, boolean trashed, String field,
        boolean byRow, boolean ascending, Pageable page);
    Optional<CollectionRecordEntity> findByCollectionIdAndId(UUID collectionId, UUID id);
    /** Active/trashed totals for a whole page of collections in one grouped query (no N+1). */
    @Query("select r.collectionId as collectionId, sum(case when r.trashed = false then 1 else 0 end) as active, "
        + "sum(case when r.trashed = true then 1 else 0 end) as trashed "
        + "from CollectionRecordEntity r where r.collectionId in :ids group by r.collectionId")
    List<Counts> countsByCollection(Collection<UUID> ids);
    @Query("select count(r) from CollectionRecordEntity r where r.collectionId = :collectionId and r.trashed = false "
        + "and (:excluded is null or r.id <> :excluded) and (r.rowHash = :rowHash or (:occurrenceHash is not null and r.occurrenceHash = :occurrenceHash))")
    long collisions(UUID collectionId, UUID excluded, String rowHash, String occurrenceHash);

    interface Counts {
        UUID getCollectionId();
        long getActive();
        long getTrashed();
    }
}
