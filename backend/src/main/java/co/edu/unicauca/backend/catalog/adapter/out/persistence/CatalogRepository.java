package co.edu.unicauca.backend.catalog.adapter.out.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface CatalogRepository extends JpaRepository<CatalogSnapshot, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from CatalogSnapshot s where s.id = 1")
    CatalogSnapshot lockSnapshot();
}
