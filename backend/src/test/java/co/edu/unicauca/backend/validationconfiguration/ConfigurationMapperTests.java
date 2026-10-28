package co.edu.unicauca.backend.validationconfiguration;

import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration.Context;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.mapper.ConfigurationHttpMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.mapper.ConfigurationPersistenceMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;

class ConfigurationMapperTests {
    final ConfigurationHttpMapper http = Mappers.getMapper(ConfigurationHttpMapper.class);
    final ConfigurationPersistenceMapper persistence = Mappers.getMapper(ConfigurationPersistenceMapper.class);
    final JsonMapper json = JsonMapper.builder().build();

    ValidationConfiguration value(long revision) {
        return ValidationConfiguration.builder().revision(revision).contexts(Arrays.stream(Context.values())
            .map(context -> ContextFields.builder().context(context).requiredFields(List.of(" campo Ω\n ", "county")).build()).toList()).build();
    }
    @Test void generatedMappersRoundTripOriginalTextAndEveryContext() {
        var original = value(7);
        var request = json.readValue(json.writeValueAsString(original), UpdateConfigurationRequest.class);
        assertThat(http.toDomain(request)).isEqualTo(original);
        assertThat(json.readTree(json.writeValueAsString(http.toResponse(original))))
            .isEqualTo(json.readTree(json.writeValueAsString(original)));
        assertThat(persistence.toDomain(persistence.toEntity(original, json), json)).isEqualTo(original);
        assertThat(http.getClass().getSimpleName()).isEqualTo("ConfigurationHttpMapperImpl");
        assertThat(persistence.getClass().getSimpleName()).isEqualTo("ConfigurationPersistenceMapperImpl");
        var otherCodec = JsonMapper.builder().build();
        assertThat(persistence.toDomain(persistence.toEntity(original, otherCodec), otherCodec)).isEqualTo(original);
    }
    @Test void managedReplacementNeverChangesIdentity() {
        var entity = persistence.toEntity(value(0), json);
        var next = value(9);
        persistence.replace(entity, next, json);
        assertThat(entity.getId()).isEqualTo((short) 1);
        assertThat(persistence.toDomain(entity, json)).isEqualTo(next);
    }
    @Test void strictJsonRejectsNullAndNumericContextWithoutCoercion() {
        for (String token : List.of("0", "true", "null", "\"unknown\"")) {
            String input = json.writeValueAsString(value(0)).replace("\"collection\"", token);
            assertThatThrownBy(() -> json.readValue(input, ConfigurationJson.class)).isInstanceOf(RuntimeException.class);
        }
    }
}
