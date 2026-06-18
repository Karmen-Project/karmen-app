# Karmen Backend

Spring Boot 3.2.4 · Java 21 · API REST para la plataforma Karmen.

## Requisitos locales
- Docker + Docker Compose (recomendado)
- O: Java 21+ y Maven 3.9+ (sin Docker)

## Inicio rápido (Docker)

```bash
cp .env.example .env   # edita con tus valores
docker compose up -d   # levanta backend + BD + Prometheus + Grafana
```

| Servicio | URL |
|---|---|
| API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Grafana | http://localhost:3001 |

## Variables de entorno requeridas

Ver [`.env.example`](.env.example) para la lista completa con descripciones.

Variables mínimas:

```bash
DATABASE_URL=jdbc:postgresql://localhost:5433/karmen
DB_USER=karmen_user
DB_PASS=karmen_pass
JWT_SECRET=$(openssl rand -base64 48)
JWT_EXPIRATION=86400000
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=/app/uploads
```

### Extracción de facturas con IA (opcional)

```bash
GOOGLE_API_KEY=tu-key-de-google-ai-studio   # gratis en https://aistudio.google.com/apikey
GEMINI_ENABLED=true                          # false → usa solo el parser de regex
GEMINI_MODEL=gemini-2.5-flash                # modelo del tier gratuito
```

Si no defines `GOOGLE_API_KEY` (o pones `GEMINI_ENABLED=false`), el OCR sigue funcionando
con el parser de regex de respaldo — la IA es opcional.

## Endpoints principales

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Registrar usuario + empresa |
| `POST` | `/api/auth/login` | — | Login → JWT |
| `GET` | `/api/invoices?companyId=X` | JWT | Listar facturas |
| `POST` | `/api/invoices/upload?companyId=X&type=X` | JWT | Subir factura + OCR |
| `PATCH` | `/api/invoices/{id}/confirm` | JWT | Confirmar + contabilizar |
| `GET` | `/api/accounting-entries?companyId=X` | JWT | Asientos contables |
| `GET` | `/api/reports/monthly?companyId=X` | JWT | Reporte mensual |
| `GET` | `/api/providers?companyId=X` | JWT | Proveedores |
| `GET` | `/actuator/health` | — | Health check (Render) |
| `GET` | `/actuator/prometheus` | Bearer token* | Métricas Prometheus |

*`/actuator/prometheus` requiere `Authorization: Bearer $METRICS_TOKEN` cuando `METRICS_TOKEN` está configurado.

## Extracción de facturas (OCR + IA)

Al subir una factura (`POST /api/invoices/upload`), el backend extrae automáticamente
sus campos (`numero`, `fecha`, `empresa`, `nit`, `concepto`, `metodoPago`, `subtotal`,
`iva`, `total`) y los guarda en la factura y en `ocr_extractions`.

### Flujo

```
Upload → guardar archivo → TesseractService (texto OCR + confianza)
       → GeminiInvoiceExtractor (campos estructurados) → Invoice + OcrExtraction
```

1. **`TesseractService`** saca el texto crudo de la imagen/PDF (Tesseract para imágenes,
   `pdftotext` para PDFs digitales) y un puntaje de confianza. Esto se guarda como
   auditoría en `ocr_extractions.raw_text`.
2. **`GeminiInvoiceExtractor`** obtiene los campos estructurados con IA:
   - **Imágenes** (`.jpg`, `.png`, `.webp`, `.gif`) → **visión**: la imagen se envía directo
     a Gemini, que hace OCR + extracción + entiende el layout en una sola llamada. Es mucho
     más preciso con tiquetes térmicos fotografiados.
   - **PDF y otros** → se le pasa a Gemini el texto OCR que ya produjo Tesseract.
   - El modelo devuelve un JSON estructurado (`responseMimeType: application/json`) con las
     claves de arriba, que se mapea a la entidad `Invoice`.
3. **Respaldo:** si la IA está deshabilitada, no hay API key, o la llamada falla, se usa el
   parser de reglas **`InvoiceParser`** (regex) automáticamente. El sistema nunca queda sin
   extracción.

### ¿Por qué IA en vez de solo regex?

`InvoiceParser` requería mantener cientos de patrones regex, uno por cada formato de factura
colombiana. La IA entiende cualquier layout sin enumerar patrones, y queda como respaldo para
cuando la IA no está disponible.

### Configuración

- Modelo y activación: variables `GEMINI_*` (ver [Variables de entorno](#extracción-de-facturas-con-ia-opcional)).
- API key gratuita: [Google AI Studio](https://aistudio.google.com/apikey) → variable `GOOGLE_API_KEY`.

> **Nota tier gratuito:** tiene límites de peticiones por minuto/día y, según la política de
> Google, los datos pueden usarse para mejorar sus modelos. Para producción con datos fiscales
> sensibles, considera el tier de pago o Vertex AI.

## Seguridad

- JWT firmado con HMAC-SHA256 · expiración configurable.
- BCrypt factor 12 para contraseñas.
- CORS limitado al origen configurado en `CORS_ALLOWED_ORIGINS`.
- `MetricsAuthFilter` protege el endpoint de métricas con Bearer token.
- Multi-tenencia: cada operación valida el `companyId` del token.

## Pruebas

```bash
mvn test          # solo pruebas
mvn verify        # pruebas + reporte JaCoCo
```

~55 pruebas (unitarias + integración). Cobertura objetivo: 80%+.

## Despliegue en Render

1. Conecta el repositorio en Render → selecciona `karmen-backend/` como raíz.
2. Render detecta el `Dockerfile` automáticamente.
3. Configura las variables de entorno en el dashboard de Render (ver `.env.example`).
4. Health check: `GET /actuator/health` → 200 OK.
