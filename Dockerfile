# =============================
# Estágio 1: Build do frontend
# =============================
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copiar apenas arquivos de dependência primeiro (cache de camadas)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código-fonte e buildar frontend
COPY . .
RUN npm run build


# =============================
# Estágio 2: Build do servidor
# =============================
FROM node:22-alpine AS server-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server/ ./server/
COPY tsconfig.server.json ./
RUN npx tsc -p tsconfig.server.json


# =============================
# Estágio 3: Imagem de produção
# =============================
FROM node:22-alpine AS production

WORKDIR /app

# Copiar apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar frontend buildado
COPY --from=frontend-build /app/dist ./dist

# Copiar servidor compilado
COPY --from=server-build /app/server-dist ./server-dist

# Criar diretório de dados
RUN mkdir -p /app/data

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/traces || exit 1

CMD ["node", "server-dist/index.js"]
