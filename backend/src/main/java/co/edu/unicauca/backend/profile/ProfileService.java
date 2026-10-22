package co.edu.unicauca.backend.profile;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@Service
public class ProfileService {
    private final ProfileRepository repository;
    private final Validator validator;
    private final ProfileMapper mapper;

    public ProfileService(ProfileRepository repository, Validator validator, ProfileMapper mapper) {
        this.repository = repository;
        this.validator = validator;
        this.mapper = mapper;
    }
    @Transactional(readOnly = true)
    public List<Profile> list() {
        return repository.findAllByOrderByNameAscVersionAscIdAsc().stream().map(mapper::toDto).toList();
    }
    @Transactional
    public Profile create(Profile.Create request) {
        return insert(UUID.randomUUID().toString(), request, Profile.Status.DRAFT, 0, false);
    }
    @Transactional
    public Profile update(String id, Profile.Update request) {
        ProfileEntity current = lockDraft(id);
        if (current.revision() != request.revision()) {
            throw new ProfileConflictException("La revisión del perfil cambió; actualice los datos antes de guardar.");
        }
        Profile next = content(id, request.content(), Profile.Status.DRAFT, current.revision() + 1);
        mapper.replace(current, next);
        repository.flush();
        return next;
    }
    @Transactional
    public Profile duplicate(String id, Profile.Duplicate request) {
        Profile source = mapper.toDto(repository.findById(id).orElseThrow(ProfileService::notFound));
        return insert(UUID.randomUUID().toString(), new Profile.Create(request.name(), request.version(),
            source.description(), source.rules()), Profile.Status.DRAFT, 0, false);
    }
    @Transactional
    public Profile publish(String id) {
        // The same row lock serializes publishing with editing and other publishers.
        ProfileEntity entity = lockDraft(id);
        Profile current = mapper.toDto(entity);
        Profile published = new Profile(current.id(), current.name(), current.version(),
            Profile.Status.PUBLISHED, current.revision() + 1, current.description(), current.rules());
        mapper.replace(entity, published);
        repository.flush();
        return published;
    }
    @Transactional
    public void initialize(List<Profile> seeds) {
        for (Profile seed : seeds) {
            if (seed.status() != Profile.Status.PUBLISHED || seed.revision() != 0) {
                throw new IllegalStateException("Los perfiles iniciales deben estar publicados con revisión cero.");
            }
            UUID.fromString(seed.id());
            insert(seed.id(), new Profile.Create(seed.name(), seed.version(), seed.description(), seed.rules()),
                seed.status(), seed.revision(), true);
        }
    }
    private Profile insert(String id, Profile.Create request, Profile.Status status, long revision, boolean seed) {
        Profile result = content(id, request, status, revision);
        if (seed) {
            repository.insertSeed(result.id(), result.name(), result.version(), result.status(), result.revision(),
                result.description(), mapper.rules(result));
        } else {
            repository.saveAndFlush(mapper.toEntity(result));
        }
        return result;
    }
    private Profile content(String id, Profile.Create request, Profile.Status status, long revision) {
        var violations = validator.validate(request);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return new Profile(id, request.name().trim(), request.version().trim(), status, revision,
            request.description(), List.copyOf(request.rules()));
    }
    private ProfileEntity lockDraft(String id) {
        ProfileEntity profile = repository.lockDraft(id).orElseThrow(ProfileService::notFound);
        if (profile.status() != Profile.Status.DRAFT) {
            throw new ProfileConflictException("Las versiones publicadas son inmutables; duplique el perfil en una nueva versión.");
        }
        return profile;
    }
    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el perfil.");
    }
}
