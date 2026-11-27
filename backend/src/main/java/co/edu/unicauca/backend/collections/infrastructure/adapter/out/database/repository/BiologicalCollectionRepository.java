package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.BiologicalCollectionEntity;

public interface BiologicalCollectionRepository extends JpaRepository<BiologicalCollectionEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from BiologicalCollectionEntity c where c.id = :id")
    Optional<BiologicalCollectionEntity> lock(UUID id);
}
