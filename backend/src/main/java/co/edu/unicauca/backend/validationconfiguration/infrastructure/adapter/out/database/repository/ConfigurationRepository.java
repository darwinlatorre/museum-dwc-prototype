package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.repository;

import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.entity.ConfigurationEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConfigurationRepository extends JpaRepository<ConfigurationEntity, Short> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ConfigurationEntity c where c.id = 1")
    Optional<ConfigurationEntity> lockGlobal();

    @Modifying
    @Query("insert into ConfigurationEntity (id, revision, contexts) values (1, 0, :contexts) on conflict (id) do nothing")
    int insertSeed(@Param("contexts") String contexts);
}
