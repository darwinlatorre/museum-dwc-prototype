package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.service;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogStatusResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogSyncResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper.CatalogHttpMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Fachada del transporte: no contiene política de sincronización ni transacciones. */
@RequiredArgsConstructor
public class CatalogWebService {
    private final CatalogOperations operations;
    private final CatalogHttpMapper mapper;

    public String catalog() { return operations.payload(); }

    public CatalogStatusResponse status() { return mapper.toResponse(operations.status()); }

    public CatalogSyncResponse synchronize(HttpServletRequest request) throws IOException {
        // Cualquier byte, incluido espacio o JSON null, rompe el contrato de cuerpo vacío.
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La solicitud de sincronización debe tener el cuerpo vacío.");
        }
        return mapper.toResponse(operations.synchronize());
    }
}
