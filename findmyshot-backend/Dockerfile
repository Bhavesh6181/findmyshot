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

# Execute Spring Boot application with JVM flags tuned for a fractional-vCPU
# cloud container (e.g., Render free/starter tier: ~0.1-0.5 vCPU, 512MB RAM).
# -XX:ActiveProcessorCount=1  : Pins JVM's own pool sizing (GC, ForkJoinPool) to 1 core
#                               instead of reading the host's 16-32 core count.
# -Xmx300m                    : Hard heap limit below container ceiling to avoid OOM kills.
# -XX:MaxMetaspaceSize=64m    : Bound metaspace; ONNX models load a lot of class data.
ENTRYPOINT ["sh", "-c", "java -XX:ActiveProcessorCount=1 -Xmx300m -XX:MaxMetaspaceSize=64m -Dserver.port=${PORT} -jar app.jar"]

