package co.edu.unicauca.backend.profile.domain.exception;

public class ProfileConflictException extends RuntimeException {
    public ProfileConflictException(String message) {
        super(message);
    }
}
