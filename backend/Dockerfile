# ========================================================================
# BASE — dependencias Maven
# ========================================================================
FROM maven:3.10.0-eclipse-temurin-27-resolute AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline


# ========================================================================
# DEVELOPMENT — ejecución desde fuentes
# ========================================================================
FROM base AS development

COPY src ./src

EXPOSE 8080

CMD ["mvn", "-B", "-ntp", "spring-boot:run", "-Dspring-boot.run.arguments=--server.address=0.0.0.0"]


# ========================================================================
# BUILD — compilación del JAR
# ========================================================================
FROM base AS build

COPY src ./src
RUN mvn -B -ntp -DskipTests package \
    && cp target/backend-0.0.1-SNAPSHOT.jar /tmp/backend.jar


# ========================================================================
# PRODUCTION — runtime no privilegiado
# ========================================================================
FROM eclipse-temurin:27-jre-resolute AS production

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system museum \
    && useradd --system --gid museum --no-create-home museum

WORKDIR /app

COPY --from=build --chown=museum:museum /tmp/backend.jar /app/backend.jar

USER museum

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/backend.jar"]
CMD ["--server.address=0.0.0.0"]
