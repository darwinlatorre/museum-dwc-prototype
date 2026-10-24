package co.edu.unicauca.backend.profile.domain;

/** Las mismas fronteras de contenido para HTTP, duplicación y semillas. */
public final class ProfileValidation {
    private ProfileValidation() {}

    public static void validate(Profile.Content content) {
        if (content == null || !text(content.name(), 200) || !text(content.version(), 100)
                || content.description() == null || content.description().length() > 10000
                || content.rules() == null || content.rules().size() > 2000) {
            throw new ProfileValidationException();
        }
        for (Profile.Rule rule : content.rules()) {
            if (rule == null || !text(rule.field(), 200) || rule.kind() == null
                    || rule.severity() == null || rule.condition() == null
                    || !text(rule.message(), 2000) || !text(rule.source(), 4000)) {
                throw new ProfileValidationException();
            }
        }
    }

    private static boolean text(String value, int maximum) {
        return value != null && !value.isBlank() && value.length() <= maximum;
    }
}
