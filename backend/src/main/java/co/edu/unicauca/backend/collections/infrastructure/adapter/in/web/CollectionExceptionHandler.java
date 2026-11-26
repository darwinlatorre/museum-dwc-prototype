package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure.Code;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper.CollectionHttpMapper;

/** Exhaustive switches: a new failure code does not compile until it has a status and a message. */
@RestControllerAdvice(assignableTypes = CollectionController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class CollectionExceptionHandler {
    private final CollectionHttpMapper mapper;

    @ExceptionHandler(CollectionFailure.class)
    public ProblemDetail failure(CollectionFailure failure) {
        HttpStatus status = status(failure.code());
        var detail = ProblemDetail.forStatusAndDetail(status, message(failure.code()));
        detail.setTitle(switch (status) {
            case BAD_REQUEST -> "Solicitud incorrecta";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto";
            case UNPROCESSABLE_CONTENT -> "Validación pendiente";
            case CONTENT_TOO_LARGE -> "Solicitud demasiado grande";
            default -> "Servicio no disponible";
        });
        detail.setProperty("code", failure.code().name());
        detail.setProperty("issues", failure.issues().stream().map(mapper::issue).toList());
        return detail;
    }

    private static HttpStatus status(Code code) {
        return switch (code) {
            case INVALID_REQUEST, INVALID_MAPPING, INVALID_PAGING, TOO_MANY_ISSUES -> HttpStatus.BAD_REQUEST;
            case PAYLOAD_TOO_LARGE -> HttpStatus.CONTENT_TOO_LARGE;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case AUTHORITY_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            case VALIDATION_FAILED, WARNINGS_UNCONFIRMED -> HttpStatus.UNPROCESSABLE_CONTENT;
            case CONFIGURATION_CHANGED, CATALOG_CHANGED, REVISION_CONFLICT, CONTEXT_CONFLICT, IDEMPOTENCY_CONFLICT,
                 DUPLICATE, RECORD_TRASHED, RECORD_ACTIVE -> HttpStatus.CONFLICT;
        };
    }

    private static String message(Code code) {
        return switch (code) {
            case INVALID_REQUEST -> "El contenido de la solicitud no es válido.";
            case INVALID_MAPPING -> "Dos columnas de origen no pueden asignarse al mismo campo.";
            case INVALID_PAGING -> "La paginación no es válida.";
            case PAYLOAD_TOO_LARGE -> "La solicitud supera el tamaño permitido.";
            case TOO_MANY_ISSUES -> "Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño.";
            case NOT_FOUND -> "No se encontró el recurso solicitado.";
            case AUTHORITY_UNAVAILABLE -> "La configuración o el catálogo no están disponibles. Actualice los datos.";
            case CONFIGURATION_CHANGED -> "La configuración de validación cambió; vuelva a analizar los datos.";
            case CATALOG_CHANGED -> "El catálogo TDWG cambió; vuelva a analizar los datos.";
            case REVISION_CONFLICT -> "La revisión de la colección cambió; actualice los datos antes de guardar.";
            case CONTEXT_CONFLICT -> "El contexto no coincide con el de la colección.";
            case IDEMPOTENCY_CONFLICT -> "La clave de importación ya se utilizó con otra solicitud.";
            case DUPLICATE -> "La operación contiene registros duplicados dentro de esta colección.";
            case VALIDATION_FAILED -> "Los errores de validación impiden guardar los registros.";
            case WARNINGS_UNCONFIRMED -> "Confirme las advertencias antes de guardar los registros.";
            case RECORD_TRASHED -> "El registro está en la papelera.";
            case RECORD_ACTIVE -> "El registro ya está activo.";
        };
    }
}
