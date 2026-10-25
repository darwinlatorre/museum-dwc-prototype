package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database;

import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity.ProfileEntity;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper.ProfilePersistenceMapper;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.repository.ProfileRepository;

import co.edu.unicauca.backend.profile.application.port.out.ProfileStore;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.domain.exception.ProfileNotFoundException;
import java.util.List;
import java.util.Optional;

public class JpaProfileStore implements ProfileStore {
    private final ProfileRepository repository;
    private final ProfilePersistenceMapper mapper;

    public JpaProfileStore(ProfileRepository repository, ProfilePersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<Profile> list() {
        return repository.findAllByOrderByNameAscVersionAscIdAsc().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Profile> find(String id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Profile> lock(String id) {
        return repository.lockDraft(id).map(mapper::toDomain);
    }

    @Override
    public void insert(Profile profile) {
        repository.saveAndFlush(mapper.toEntity(profile));
    }

    @Override
    public void replace(Profile profile) {
        // findById returns the managed instance already locked in this same transaction.
        ProfileEntity entity = repository.findById(profile.id()).orElseThrow(ProfileNotFoundException::new);
        mapper.replace(entity, profile);
        repository.flush();
    }

    @Override
    public void insertSeed(Profile profile) {
        repository.insertSeed(profile.id(), profile.name(), profile.version(), mapper.status(profile), profile.revision(),
            profile.description(), mapper.rules(profile));
    }
}
