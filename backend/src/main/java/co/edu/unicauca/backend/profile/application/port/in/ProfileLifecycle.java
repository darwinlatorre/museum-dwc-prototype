package co.edu.unicauca.backend.profile.application.port.in;

import co.edu.unicauca.backend.profile.domain.Profile;
import java.util.List;

public interface ProfileLifecycle {
    List<Profile> list();
    Profile create(Profile.Content content);
    Profile update(String id, Profile.Content content, long revision);
    Profile duplicate(String id, String name, String version);
    Profile publish(String id);
    void initialize(List<Profile> seeds);
}
