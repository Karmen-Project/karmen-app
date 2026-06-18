# ── Stage 1: Dependencias (cache layer) ─────────────────────
FROM eclipse-temurin:21-jdk AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y maven --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY pom.xml .
RUN mvn dependency:go-offline -B

# ── Stage 2: Test ────────────────────────────────────────────
FROM deps AS test
COPY src ./src
# CMD (no RUN): los tests corren cuando el contenedor inicia,
# DESPUÉS de que Docker monta el volumen de reportes.
# Si fuera RUN, los reportes quedarían dentro de la imagen y
# el volumen vacío del host los sobreescribiría al arrancar.
# -Dmaven.test.failure.ignore=true: continúa hasta la fase verify aunque fallen tests,
# garantizando que JaCoCo genere el reporte HTML en target/site/jacoco/index.html.
CMD ["mvn", "verify", "-Dmaven.test.failure.ignore=true"]

# ── Stage 3: Build (producción) ──────────────────────────────
FROM deps AS builder
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime ──────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Crear usuario seguro
RUN groupadd -r karmen && useradd -r -g karmen karmen

# Instalar Tesseract + poppler-utils (pdftotext para PDFs digitales, OCR para escaneados)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    tesseract-ocr-eng \
    poppler-utils \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar JAR y script de entrada
COPY --from=builder /app/target/*.jar app.jar
COPY entrypoint.sh entrypoint.sh
RUN sed -i 's/\r//' entrypoint.sh && chmod +x entrypoint.sh

# Carpeta uploads
RUN mkdir -p /app/uploads && chown -R karmen:karmen /app

USER karmen

EXPOSE 8080

# entrypoint.sh detecta TESSDATA_PREFIX automáticamente según la versión instalada
ENTRYPOINT ["sh", "entrypoint.sh"]