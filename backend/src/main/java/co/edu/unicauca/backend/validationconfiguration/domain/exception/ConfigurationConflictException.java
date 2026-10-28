package co.edu.unicauca.backend.validationconfiguration.domain.exception;

public class ConfigurationConflictException extends RuntimeException {
    public ConfigurationConflictException() {
        super("La revisión de la configuración cambió; actualice los datos antes de guardar.");
    }
}
