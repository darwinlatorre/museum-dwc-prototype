package co.edu.unicauca.backend.profile.domain;

public class ProfileValidationException extends RuntimeException {
    public ProfileValidationException() {
        super("El contenido del perfil no es válido.");
    }
}
