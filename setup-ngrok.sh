#!/bin/bash

set -e

echo "🚀 Setup LavaCar com NGrok"
echo "============================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar Docker
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose encontrado${NC}"

# 2. Verificar .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    if [ -f .env.ngrok.example ]; then
        echo "Copiando .env.ngrok.example para .env..."
        cp .env.ngrok.example .env
        echo -e "${GREEN}✅ .env criado${NC}"
    else
        echo -e "${RED}❌ Não encontrei .env.ngrok.example${NC}"
        exit 1
    fi
fi

# 3. Verificar NGROK_AUTHTOKEN
NGROK_TOKEN=$(grep NGROK_AUTHTOKEN .env | cut -d '=' -f2)
if [ -z "$NGROK_TOKEN" ] || [ "$NGROK_TOKEN" == "your_ngrok_auth_token_here" ]; then
    echo ""
    echo -e "${BLUE}📝 Configure seu NGrok Auth Token:${NC}"
    echo ""
    echo "   1. Acesse: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   2. Copie seu token"
    echo "   3. Edite .env e substitua NGROK_AUTHTOKEN"
    echo ""
    read -p "Já configurou o NGROK_AUTHTOKEN em .env? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}❌ Cancele o setup e configure o token${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ NGrok Auth Token verificado${NC}"

# 4. Iniciar containers
echo ""
echo -e "${BLUE}🐳 Iniciando Docker Compose com NGrok...${NC}"
echo ""

docker-compose -f docker-compose.yml -f docker-compose.ngrok.yml --profile ngrok up -d

# 5. Aguardar NGrok estar pronto
echo ""
echo -e "${BLUE}⏳ Aguardando NGrok inicializar...${NC}"

for i in {1..30}; do
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
done

echo ""

# 6. Obter URL pública
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-z0-9-]*\.ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${YELLOW}⚠️  Não foi possível obter automaticamente a URL do NGrok${NC}"
    echo ""
    echo "   Acesse o painel: http://localhost:4040"
    echo "   E copie a URL pública"
    echo ""
    read -p "Digite a URL do NGrok (ex: https://abc-xyz.ngrok-free.dev): " NGROK_URL
fi

echo ""
echo -e "${GREEN}✅ URL do Backend (NGrok):${NC}"
echo -e "${BLUE}   📍 $NGROK_URL${NC}"
echo ""

# 7. Instruções para o frontend
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos - Configure o Frontend:${NC}"
echo ""
echo "   1. Abra o terminal em lavacar-app/"
echo "   2. Copie a URL acima"
echo "   3. Crie/edite .env.local:"
echo ""
echo "      export NEXT_PUBLIC_API_URL=$NGROK_URL"
echo ""
echo "   4. Inicie o frontend:"
echo ""
echo "      npm run dev  # ou  pnpm dev"
echo ""
echo ""
echo -e "${BLUE}🔧 URLs Úteis:${NC}"
echo "   - Painel NGrok: http://localhost:4040"
echo "   - Backend: $NGROK_URL"
echo "   - Backend Local: http://localhost:3000"
echo "   - PostgreSQL: localhost:3002"
echo ""
echo -e "${BLUE}📚 Documentação: leia NGROK_SETUP.md${NC}"
