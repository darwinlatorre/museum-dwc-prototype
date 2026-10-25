package co.edu.unicauca.backend.profile.application.port.out;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import java.util.List;
import java.util.Optional;

/** El adaptador de transacción conserva el bloqueo durante todo el caso de uso. */
public interface ProfileStore {
    List<Profile> list();
    Optional<Profile> find(String id);
    Optional<Profile> lock(String id);
    void insert(Profile profile);
    void replace(Profile profile);
    void insertSeed(Profile profile);
}
