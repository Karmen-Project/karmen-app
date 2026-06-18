#!/bin/bash
# Script para iniciar el frontend con Node.js 20.19.0

# Cargar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node.js 20.19.0
nvm use 20.19.0

# Cambiar al directorio frontend
cd /Users/yzapata/Documents/karmen/karmen-frontend

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

# Iniciar el servidor de desarrollo
echo "🚀 Iniciando Vite dev server en http://localhost:5173"
npm run dev
