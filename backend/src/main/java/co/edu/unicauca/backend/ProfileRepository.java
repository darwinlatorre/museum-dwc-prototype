package co.edu.unicauca.backend;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class ProfileRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public ProfileRepository(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }
    public List<Profile> findAll() {
        return jdbc.query("SELECT * FROM profiles ORDER BY name, version, id", this::map);
    }
    public Optional<Profile> find(String id, boolean lock) {
        return jdbc.query("SELECT * FROM profiles WHERE id = ?" + (lock ? " FOR UPDATE" : ""),
            this::map, id).stream().findFirst();
    }
    public void insert(Profile profile, boolean seed) {
        jdbc.update("""
            INSERT INTO profiles(id, name, version, status, revision, description, rules)
            VALUES (?, ?, ?, ?, ?, ?, ?::jsonb)
            """ + (seed ? " ON CONFLICT (id) DO NOTHING" : ""),
            profile.id(), profile.name(), profile.version(), profile.status().name(),
            profile.revision(), profile.description(), json.writeValueAsString(profile.rules()));
    }
    public void update(Profile profile, long expectedRevision) {
        int changed = jdbc.update("""
            UPDATE profiles SET name = ?, version = ?, status = ?, revision = ?, description = ?, rules = ?::jsonb
            WHERE id = ? AND revision = ? AND status = 'DRAFT'
            """, profile.name(), profile.version(), profile.status().name(), profile.revision(),
            profile.description(), json.writeValueAsString(profile.rules()), profile.id(), expectedRevision);
        if (changed != 1) throw new ProfileConflictException("La revisión del perfil cambió; actualice los datos antes de guardar.");
    }
    private Profile map(ResultSet row, int index) throws SQLException {
        return new Profile(row.getString("id"), row.getString("name"), row.getString("version"),
            Profile.Status.valueOf(row.getString("status")), row.getLong("revision"),
            row.getString("description"), json.readValue(row.getString("rules"), new TypeReference<>() {}));
    }
}
