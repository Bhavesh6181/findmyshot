# Stage 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (cached)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and models
COPY src ./src
COPY models ./models

# Package application (skipping tests for production build)
RUN mvn package -DskipTests

# Stage 2: Runtime environment
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy packaged jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Copy ONNX models from build stage
COPY --from=build /app/models ./models

# Set active profile and port mapping
ENV SPRING_PROFILES_ACTIVE=production
ENV PORT=8080
EXPOSE 8080

# Execute Spring Boot application
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]

