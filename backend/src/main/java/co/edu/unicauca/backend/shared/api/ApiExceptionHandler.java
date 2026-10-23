package co.edu.unicauca.backend.shared.api;

import co.edu.unicauca.backend.shared.exceptions.ProfileConflictException;

import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    @ExceptionHandler(ProfileConflictException.class)
    public ProblemDetail conflict(ProfileConflictException exception) {
        return problem(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail integrityConflict() {
        // Never expose SQL, schema names, or database exception details to clients.
        return problem(HttpStatus.CONFLICT,
            "El nombre y la versión del perfil deben ser únicos; las versiones publicadas son inmutables.");
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail invalid() {
        return problem(HttpStatus.BAD_REQUEST, "El contenido del perfil no es válido.");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail request(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return problem(status, exception.getReason() == null
            ? "No se pudo procesar la solicitud." : exception.getReason());
    }

    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        HttpStatus status = HttpStatus.valueOf(statusCode.value());
        ProblemDetail detail = body instanceof ProblemDetail existing ? existing
            : ProblemDetail.forStatus(statusCode);
        detail.setTitle(title(status));
        detail.setDetail(switch (status) {
            case BAD_REQUEST -> "El contenido del perfil no es válido.";
            case NOT_FOUND -> "No se encontró el recurso solicitado.";
            case METHOD_NOT_ALLOWED -> "El método HTTP no está permitido para este recurso.";
            case UNSUPPORTED_MEDIA_TYPE -> "El tipo de contenido no es compatible; utilice application/json.";
            case NOT_ACCEPTABLE -> "No se puede generar una respuesta en el formato solicitado.";
            default -> "No se pudo procesar la solicitud.";
        });
        // Preserve Spring's status, instance and protocol headers (including Allow/Accept).
        return super.createResponseEntity(detail, headers, statusCode, request);
    }

    private static ProblemDetail problem(HttpStatus status, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title(status));
        return problem;
    }

    private static String title(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Solicitud incorrecta";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto";
            case METHOD_NOT_ALLOWED -> "Método no permitido";
            case UNSUPPORTED_MEDIA_TYPE -> "Tipo de contenido no compatible";
            case NOT_ACCEPTABLE -> "Formato de respuesta no disponible";
            default -> "Error de la solicitud";
        };
    }
}
