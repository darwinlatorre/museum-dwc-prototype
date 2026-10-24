FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system museum && useradd --system --gid museum --no-create-home museum
COPY --chown=museum:museum target/backend-0.0.1-SNAPSHOT.jar /app/backend.jar
COPY --chown=museum:museum docker-healthcheck.sh /app/docker-healthcheck.sh
USER museum
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/backend.jar"]
