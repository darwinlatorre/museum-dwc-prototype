package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.service;

import co.edu.unicauca.backend.profile.application.port.in.ProfileLifecycle;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.DuplicateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.mapper.ProfileHttpMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Coordinación HTTP: conversiones y restricciones de transporte fuera del núcleo puro. */
@RequiredArgsConstructor
public class ProfileWebService {
    private final ProfileLifecycle lifecycle;
    private final ProfileHttpMapper mapper;

    public List<ProfileResponse> list() {
        return lifecycle.list().stream().map(mapper::toResponse).toList();
    }

    public ProfileResponse create(CreateProfileRequest request) {
        return mapper.toResponse(lifecycle.create(mapper.toContent(request)));
    }

    public ProfileResponse update(String id, UpdateProfileRequest request) {
        return mapper.toResponse(lifecycle.update(id, mapper.toContent(request), request.revision()));
    }

    public ProfileResponse duplicate(String id, DuplicateProfileRequest request) {
        return mapper.toResponse(lifecycle.duplicate(id, request.name(), request.version()));
    }

    public ProfileResponse publish(String id, HttpServletRequest request) throws IOException {
        // Incluso JSON null, espacios o contenido malformado constituyen un cuerpo no vacío.
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud de publicación debe tener el cuerpo vacío.");
        }
        return mapper.toResponse(lifecycle.publish(id));
    }
}
