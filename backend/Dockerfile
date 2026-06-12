# syntax=docker/dockerfile:1.6

FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
RUN useradd --system --create-home --home-dir /app chainsight
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/chainsight-backend.jar
USER chainsight

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/chainsight-backend.jar"]
