package co.edu.unicauca.backend.shared.exceptions;

public class ProfileConflictException extends RuntimeException {
    public ProfileConflictException(String message) {
        super(message);
    }
}
