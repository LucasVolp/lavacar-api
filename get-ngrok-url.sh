#!/bin/bash

# Script para obter a URL pública do NGrok
# Uso: ./get-ngrok-url.sh

NGROK_API="http://localhost:4040/api/tunnels"

echo "🔍 Procurando URL do NGrok..."

# Aguardar NGrok estar pronto
for i in {1..30}; do
  if curl -s "$NGROK_API" > /dev/null 2>&1; then
    break
  fi
  echo "⏳ Aguardando NGrok inicializar... ($i/30)"
  sleep 1
done

# Obter a URL pública
NGROK_URL=$(curl -s "$NGROK_API" | grep -o 'https://[a-z0-9-]*\.ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Não foi possível obter a URL do NGrok"
  echo "   - Verifique se o NGrok está rodando: docker-compose -f docker-compose.ngrok.yml --profile ngrok ps"
  echo "   - Verifique o painel: http://localhost:4040"
  exit 1
fi

echo ""
echo "✅ URL do Backend (NGrok):"
echo "   📍 $NGROK_URL"
echo ""
echo "📋 Use esta URL no frontend:"
echo "   export NEXT_PUBLIC_API_URL=$NGROK_URL"
echo ""
echo "🔒 Painel NGrok: http://localhost:4040"
