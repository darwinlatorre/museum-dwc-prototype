package co.edu.unicauca.backend.recordsources.domain.exception;

public class ConfigurationValidationException extends RuntimeException {
    public ConfigurationValidationException() {
        super("El contenido de la configuración de validación no es válido.");
    }
}
