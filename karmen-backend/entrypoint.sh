#!/bin/sh
# Detectar ruta tessdata según la versión de Tesseract instalada.
# Tesseract 5 (Ubuntu 24.04) instala en /usr/share/tesseract-ocr/5/tessdata/spa.traineddata
# (profundidad 3), por lo que NO se puede limitar la búsqueda a maxdepth 2.
# Se busca en todas las rutas estándar sin límite de profundidad.
TESS_FILE=$(find /usr/share /usr/local/share -name "spa.traineddata" 2>/dev/null | head -1)
if [ -n "$TESS_FILE" ]; then
    TESS_DIR=$(dirname "$TESS_FILE")
    export TESSDATA_PREFIX="$TESS_DIR/"
    echo "TESSDATA_PREFIX detectado: $TESSDATA_PREFIX"
else
    echo "ADVERTENCIA: no se encontró spa.traineddata — el OCR de imágenes puede fallar"
fi
exec java -jar app.jar
