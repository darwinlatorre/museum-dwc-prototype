package co.edu.unicauca.backend.shared.infrastructure.config;

import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.cfg.EnumFeature;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.type.LogicalType;

/**
 * Strict request typing for every JSON body: JSON numbers or booleans never become biological text,
 * text never becomes numbers/booleans, and unknown properties are rejected. Null elements and ranges are
 * left to Bean Validation on the request DTOs. UUIDs must be canonical 36-character text: Jackson's default
 * deserializer trims, turns blank text into {@code null} (an append would become a new collection) and accepts base64.
 */
@Configuration(proxyBeanMethods = false)
public class StrictJsonBeanConfig {
    private static final Pattern CANONICAL_UUID =
        Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    @Bean
    JsonMapperBuilderCustomizer strictJsonCustomizer() {
        return builder -> builder
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
            .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
            .enable(EnumFeature.FAIL_ON_NUMBERS_FOR_ENUMS)
            .withCoercionConfig(LogicalType.Textual, textual -> textual
                .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail))
            .addModule(new SimpleModule("strict-uuid").addDeserializer(UUID.class, new CanonicalUuidDeserializer()));
    }

    static final class CanonicalUuidDeserializer extends ValueDeserializer<UUID> {
        @Override
        public UUID deserialize(JsonParser parser, DeserializationContext context) {
            if (!parser.hasToken(JsonToken.VALUE_STRING)) return (UUID) context.handleUnexpectedToken(UUID.class, parser);
            String text = parser.getString();
            if (!CANONICAL_UUID.matcher(text).matches()) {
                return (UUID) context.handleWeirdStringValue(UUID.class, text, "UUID must be canonical text");
            }
            return UUID.fromString(text);
        }
    }
}
