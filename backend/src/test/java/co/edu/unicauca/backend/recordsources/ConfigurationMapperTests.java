package co.edu.unicauca.backend.recordsources;

import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.mapper.ConfigurationHttpMapper;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.entity.ConfigurationEntity;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.mapper.ConfigurationPersistenceMapper;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;

class ConfigurationMapperTests {
    final ConfigurationHttpMapper http = Mappers.getMapper(ConfigurationHttpMapper.class);
    final ConfigurationPersistenceMapper persistence = Mappers.getMapper(ConfigurationPersistenceMapper.class);
    final JsonMapper json = JsonMapper.builder().build();

    ValidationConfiguration value(long revision) {
        return ValidationConfiguration.builder().revision(revision).contexts(Arrays.stream(Context.values())
            .map(context -> ContextFields.builder().context(context).requiredFields(List.of(" campo Ω\n ", "county"))
                .optionalFields(List.of(" optional Ω ", "optional")).build()).toList()).build();
    }
    ConfigurationEntity entity() {
        var entity = new ConfigurationEntity() {};
        ReflectionTestUtils.setField(entity, "id", (short) 1);
        return entity;
    }
    @Test void mappersRoundTripOriginalTextAndEveryContext() {
        var original = value(7);
        var request = json.readValue(json.writeValueAsString(original), UpdateConfigurationRequest.class);
        assertThat(http.toDomain(request)).isEqualTo(original);
        assertThat(json.readTree(json.writeValueAsString(http.toResponse(original))))
            .isEqualTo(json.readTree(json.writeValueAsString(original)));
        var entity = entity();
        persistence.replace(entity, original, json);
        assertThat(persistence.toDomain(entity, json)).isEqualTo(original);
    }
    @Test void managedReplacementNeverChangesIdentity() {
        var entity = entity();
        persistence.replace(entity, value(0), json);
        var next = value(9);
        persistence.replace(entity, next, json);
        assertThat(entity.getId()).isEqualTo((short) 1);
        assertThat(persistence.toDomain(entity, json)).isEqualTo(next);
    }
}
