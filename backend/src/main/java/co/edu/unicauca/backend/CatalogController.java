package co.edu.unicauca.backend;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;

@RestController
public class CatalogController {
    private final List<Term> terms;

    public CatalogController(ObjectMapper json) throws IOException {
        try (var input = new ClassPathResource("data/catalog.json").getInputStream()) {
            terms = List.copyOf(json.readValue(input, new TypeReference<List<Term>>() {}));
        }
    }
    @GetMapping("/api/catalog")
    public List<Term> catalog() {
        return terms;
    }
    public record Term(String name, String uri, String definition, String category, String status) {}
}
