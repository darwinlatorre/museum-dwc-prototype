package co.edu.unicauca.backend;

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

    public ProfileService(ProfileRepository repository, Validator validator) {
        this.repository = repository;
        this.validator = validator;
    }
    @Transactional(readOnly = true)
    public List<Profile> list() {
        return repository.findAll();
    }
    @Transactional
    public Profile create(Profile.Create request) {
        return insert(UUID.randomUUID().toString(), request, Profile.Status.DRAFT, 0, false);
    }
    @Transactional
    public Profile update(String id, Profile.Update request) {
        Profile current = draft(id);
        if (current.revision() != request.revision()) {
            throw new ProfileConflictException("Profile revision has changed");
        }
        Profile next = content(id, request.content(), Profile.Status.DRAFT, current.revision() + 1);
        repository.update(next, current.revision());
        return next;
    }
    @Transactional
    public Profile duplicate(String id, Profile.Duplicate request) {
        Profile source = repository.find(id, false).orElseThrow(ProfileService::notFound);
        return insert(UUID.randomUUID().toString(), new Profile.Create(request.name(), request.version(),
            source.description(), source.rules()), Profile.Status.DRAFT, 0, false);
    }
    @Transactional
    public Profile publish(String id) {
        // The same row lock serializes publishing with editing and other publishers.
        Profile current = draft(id);
        Profile published = new Profile(current.id(), current.name(), current.version(),
            Profile.Status.PUBLISHED, current.revision() + 1, current.description(), current.rules());
        repository.update(published, current.revision());
        return published;
    }
    @Transactional
    public void initialize(List<Profile> seeds) {
        for (Profile seed : seeds) {
            if (seed.status() != Profile.Status.PUBLISHED || seed.revision() != 0) {
                throw new IllegalStateException("Seeds must be published at revision zero");
            }
            UUID.fromString(seed.id());
            insert(seed.id(), new Profile.Create(seed.name(), seed.version(), seed.description(), seed.rules()),
                seed.status(), seed.revision(), true);
        }
    }
    private Profile insert(String id, Profile.Create request, Profile.Status status, long revision, boolean seed) {
        Profile result = content(id, request, status, revision);
        repository.insert(result, seed);
        return result;
    }
    private Profile content(String id, Profile.Create request, Profile.Status status, long revision) {
        var violations = validator.validate(request);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return new Profile(id, request.name().trim(), request.version().trim(), status, revision,
            request.description(), List.copyOf(request.rules()));
    }
    private Profile draft(String id) {
        Profile profile = repository.find(id, true).orElseThrow(ProfileService::notFound);
        if (profile.status() != Profile.Status.DRAFT) {
            throw new ProfileConflictException("Published profiles are immutable; duplicate to a new version");
        }
        return profile;
    }
    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
    }
}
