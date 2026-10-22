package co.edu.unicauca.backend.profile;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<ProfileEntity, String> {
    List<ProfileEntity> findAllByOrderByNameAscVersionAscIdAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ProfileEntity p where p.id = :id")
    Optional<ProfileEntity> lockDraft(@Param("id") String id);

    // HQL entity insertion preserves the original atomic ON CONFLICT(id) semantics,
    // including concurrent bootstraps, without merging managed published entities.
    @Modifying
    @Query("""
        insert into ProfileEntity (id, name, version, status, revision, description, rules)
        values (:id, :name, :version, :status, :revision, :description, :rules)
        on conflict (id) do nothing
        """)
    int insertSeed(@Param("id") String id, @Param("name") String name,
                   @Param("version") String version, @Param("status") Profile.Status status,
                   @Param("revision") long revision, @Param("description") String description,
                   @Param("rules") String rules);
}
