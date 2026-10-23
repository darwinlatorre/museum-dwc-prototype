package co.edu.unicauca.backend.profile;

import co.edu.unicauca.backend.profile.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.dto.req.DuplicateProfileRequest;
import co.edu.unicauca.backend.profile.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.dto.res.ProfileResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final ProfileService service;
    private final ProfileMapper mapper;

    public ProfileController(ProfileService service, ProfileMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }
    @GetMapping
    public List<ProfileResponse> list() {
        return service.list().stream().map(mapper::toResponse).toList();
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse create(@Valid @RequestBody CreateProfileRequest request) {
        return mapper.toResponse(service.create(mapper.toContent(request)));
    }
    @PutMapping("/{id}")
    public ProfileResponse update(@PathVariable String id, @Valid @RequestBody UpdateProfileRequest request) {
        return mapper.toResponse(service.update(id, mapper.toContent(request), request.revision()));
    }
    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse duplicate(@PathVariable String id, @Valid @RequestBody DuplicateProfileRequest request) {
        return mapper.toResponse(service.duplicate(id, request.name(), request.version()));
    }
    @PostMapping("/{id}/publish")
    public ProfileResponse publish(@PathVariable String id, HttpServletRequest request) throws IOException {
        // Check raw bytes: even JSON null, whitespace or malformed content is not an empty body.
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud de publicación debe tener el cuerpo vacío.");
        }
        return mapper.toResponse(service.publish(id));
    }
}
