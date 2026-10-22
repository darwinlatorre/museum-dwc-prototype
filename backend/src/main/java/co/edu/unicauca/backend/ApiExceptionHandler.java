package co.edu.unicauca.backend;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ProfileConflictException.class)
    public ProblemDetail conflict(ProfileConflictException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail integrityConflict() {
        // Never expose SQL, schema names, or database exception details to clients.
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "Profile name and version must be unique; published profiles are immutable");
    }
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail invalid() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid profile content");
    }
}
