package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper.CollectionHttpMapper;

@RestControllerAdvice(assignableTypes = CollectionController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class CollectionExceptionHandler {
    private final CollectionHttpMapper mapper;
    private static final Map<String, String> MESSAGES = Map.ofEntries(
        Map.entry("INVALID_REQUEST", "El contenido de la solicitud no es válido."),
        Map.entry("INVALID_MAPPING", "Dos columnas de origen no pueden asignarse al mismo campo."),
        Map.entry("INVALID_PAGING", "La paginación no es válida."),
        Map.entry("PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido."),
        Map.entry("TOO_MANY_ISSUES", "Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño."),
        Map.entry("NOT_FOUND", "No se encontró el recurso solicitado."),
        Map.entry("AUTHORITY_UNAVAILABLE", "La configuración o el catálogo no están disponibles. Actualice los datos."),
        Map.entry("CONFIGURATION_CHANGED", "La configuración de validación cambió; vuelva a analizar los datos."),
        Map.entry("CATALOG_CHANGED", "El catálogo TDWG cambió; vuelva a analizar los datos."),
        Map.entry("REVISION_CONFLICT", "La revisión de la colección cambió; actualice los datos antes de guardar."),
        Map.entry("CONTEXT_CONFLICT", "El contexto no coincide con el de la colección."),
        Map.entry("IDEMPOTENCY_CONFLICT", "La clave de importación ya se utilizó con otra solicitud."),
        Map.entry("DUPLICATE", "La operación contiene registros duplicados dentro de esta colección."),
        Map.entry("VALIDATION_FAILED", "Los errores de validación impiden guardar los registros."),
        Map.entry("WARNINGS_UNCONFIRMED", "Confirme las advertencias antes de guardar los registros."),
        Map.entry("RECORD_TRASHED", "El registro está en la papelera."),
        Map.entry("RECORD_ACTIVE", "El registro ya está activo.")
    );
    @ExceptionHandler(CollectionFailure.class)
    public ProblemDetail failure(CollectionFailure failure) {
        HttpStatus status = switch (failure.code()) {
            case "INVALID_REQUEST", "INVALID_MAPPING", "INVALID_PAGING", "TOO_MANY_ISSUES" -> HttpStatus.BAD_REQUEST;
            case "PAYLOAD_TOO_LARGE" -> HttpStatus.CONTENT_TOO_LARGE;
            case "NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "AUTHORITY_UNAVAILABLE" -> HttpStatus.SERVICE_UNAVAILABLE;
            case "VALIDATION_FAILED", "WARNINGS_UNCONFIRMED" -> HttpStatus.UNPROCESSABLE_CONTENT;
            default -> HttpStatus.CONFLICT;
        };
        var detail = ProblemDetail.forStatusAndDetail(status, MESSAGES.getOrDefault(failure.code(), "No se pudo guardar la operación."));
        detail.setTitle(switch (status) {
            case BAD_REQUEST -> "Solicitud incorrecta";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto";
            case UNPROCESSABLE_CONTENT -> "Validación pendiente";
            case CONTENT_TOO_LARGE -> "Solicitud demasiado grande";
            default -> "Servicio no disponible";
        });
        detail.setProperty("code", failure.code());
        detail.setProperty("issues", failure.issues().stream().map(mapper::issue).toList());
        return detail;
    }
}
