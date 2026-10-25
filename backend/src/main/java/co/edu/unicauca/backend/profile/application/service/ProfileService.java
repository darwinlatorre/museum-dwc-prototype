package co.edu.unicauca.backend.profile.application.service;

import co.edu.unicauca.backend.profile.application.port.in.ProfileLifecycle;
import co.edu.unicauca.backend.profile.application.port.out.ProfileStore;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.domain.exception.ProfileNotFoundException;
import co.edu.unicauca.backend.profile.domain.validation.ProfileValidation;
import co.edu.unicauca.backend.profile.domain.exception.ProfileConflictException;
import java.util.List;
import java.util.UUID;

public class ProfileService implements ProfileLifecycle {
    private final ProfileStore store;

    public ProfileService(ProfileStore store) {
        this.store = store;
    }

    @Override
    public List<Profile> list() {
        return store.list();
    }

    @Override
    public Profile create(Profile.Content request) {
        return insert(UUID.randomUUID().toString(), request, Profile.Status.DRAFT, 0, false);
    }

    @Override
    public Profile update(String id, Profile.Content request, long revision) {
        Profile current = lockDraft(id);
        if (current.revision() != revision) {
            throw new ProfileConflictException("La revisión del perfil cambió; actualice los datos antes de guardar.");
        }
        Profile next = content(id, request, Profile.Status.DRAFT, current.revision() + 1);
        store.replace(next);
        return next;
    }

    @Override
    public Profile duplicate(String id, String name, String version) {
        Profile source = store.find(id).orElseThrow(ProfileNotFoundException::new);
        return insert(UUID.randomUUID().toString(), new Profile.Content(name, version,
            source.description(), source.rules()), Profile.Status.DRAFT, 0, false);
    }

    @Override
    public Profile publish(String id) {
        Profile current = lockDraft(id);
        Profile published = current.toBuilder().status(Profile.Status.PUBLISHED)
            .revision(current.revision() + 1).build();
        store.replace(published);
        return published;
    }

    @Override
    public void initialize(List<Profile> seeds) {
        for (Profile seed : seeds) {
            if (seed.status() != Profile.Status.PUBLISHED || seed.revision() != 0) {
                throw new IllegalStateException("Los perfiles iniciales deben estar publicados con revisión cero.");
            }
            UUID.fromString(seed.id());
            insert(seed.id(), new Profile.Content(seed.name(), seed.version(), seed.description(), seed.rules()),
                seed.status(), seed.revision(), true);
        }
    }

    private Profile insert(String id, Profile.Content request, Profile.Status status, long revision, boolean seed) {
        Profile result = content(id, request, status, revision);
        if (seed) store.insertSeed(result);
        else store.insert(result);
        return result;
    }

    private Profile content(String id, Profile.Content request, Profile.Status status, long revision) {
        ProfileValidation.validate(request);
        return Profile.builder().id(id).name(request.name().trim()).version(request.version().trim())
            .status(status).revision(revision).description(request.description())
            .rules(List.copyOf(request.rules())).build();
    }

    private Profile lockDraft(String id) {
        Profile profile = store.lock(id).orElseThrow(ProfileNotFoundException::new);
        if (profile.status() != Profile.Status.DRAFT) {
            throw new ProfileConflictException("Las versiones publicadas son inmutables; duplique el perfil en una nueva versión.");
        }
        return profile;
    }
}
