package co.edu.unicauca.backend.profile.infrastructure.transaction;

import co.edu.unicauca.backend.profile.application.port.in.ProfileLifecycle;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** Una sola transacción por operación: desde el bloqueo hasta el flush. */
public class TransactionalProfileLifecycle implements ProfileLifecycle {
    private final ProfileLifecycle delegate;

    public TransactionalProfileLifecycle(ProfileLifecycle delegate) {
        this.delegate = delegate;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Profile> list() { return delegate.list(); }

    @Override
    @Transactional
    public Profile create(Profile.Content content) { return delegate.create(content); }

    @Override
    @Transactional
    public Profile update(String id, Profile.Content content, long revision) {
        return delegate.update(id, content, revision);
    }

    @Override
    @Transactional
    public Profile duplicate(String id, String name, String version) { return delegate.duplicate(id, name, version); }

    @Override
    @Transactional
    public Profile publish(String id) { return delegate.publish(id); }

    @Override
    @Transactional
    public void initialize(List<Profile> seeds) { delegate.initialize(seeds); }
}
