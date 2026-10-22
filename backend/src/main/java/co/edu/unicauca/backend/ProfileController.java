package co.edu.unicauca.backend;

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

    public ProfileController(ProfileService service) {
        this.service = service;
    }
    @GetMapping
    public List<Profile> list() {
        return service.list();
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Profile create(@Valid @RequestBody Profile.Create request) {
        return service.create(request);
    }
    @PutMapping("/{id}")
    public Profile update(@PathVariable String id, @Valid @RequestBody Profile.Update request) {
        return service.update(id, request);
    }
    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public Profile duplicate(@PathVariable String id, @Valid @RequestBody Profile.Duplicate request) {
        return service.duplicate(id, request);
    }
    @PostMapping("/{id}/publish")
    public Profile publish(@PathVariable String id, HttpServletRequest request) throws IOException {
        // Check raw bytes: even JSON null, whitespace or malformed content is not an empty body.
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Publish request body must be empty");
        }
        return service.publish(id);
    }
}
