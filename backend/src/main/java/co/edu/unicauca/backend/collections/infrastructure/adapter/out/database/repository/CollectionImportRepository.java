package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionImportEntity;

public interface CollectionImportRepository extends JpaRepository<CollectionImportEntity, UUID> {}
