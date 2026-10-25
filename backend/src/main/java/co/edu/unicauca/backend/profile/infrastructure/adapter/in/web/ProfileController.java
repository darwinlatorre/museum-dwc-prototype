package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.service.ProfileWebService;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.DuplicateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.ProfileResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final ProfileWebService service;

    @GetMapping
    public List<ProfileResponse> list() {
        return service.list();
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse create(@Valid @RequestBody CreateProfileRequest request) {
        return service.create(request);
    }
    @PutMapping("/{id}")
    public ProfileResponse update(@PathVariable String id, @Valid @RequestBody UpdateProfileRequest request) {
        return service.update(id, request);
    }
    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse duplicate(@PathVariable String id, @Valid @RequestBody DuplicateProfileRequest request) {
        return service.duplicate(id, request);
    }
    @PostMapping("/{id}/publish")
    public ProfileResponse publish(@PathVariable String id, HttpServletRequest request) throws IOException {
        return service.publish(id, request);
    }
}
