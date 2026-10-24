package co.edu.unicauca.backend.profile.domain.exception;

public class ProfileNotFoundException extends RuntimeException {
    public ProfileNotFoundException() {
        super("No se encontró el perfil.");
    }
}
