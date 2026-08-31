# syntax=docker/dockerfile:1

# --- build ---------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# environment.ts / environment.prod.ts são gitignored (credenciais reais em dev), mas hoje só
# carregam apiUrl: '/api' — sem segredo nenhum (Supabase/API URL viraram env vars do servidor,
# ver .env.example). Só existem pra `ng build` conseguir importar o módulo.
RUN cp src/environments/environment.example.ts src/environments/environment.ts && \
    cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts

RUN npm run build

# --- runtime ---------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/dashfinras-web ./dist/dashfinras-web

# TLS é responsabilidade do que estiver na frente (load balancer/reverse proxy) — sem
# SSL_CERT_PATH/SSL_KEY_PATH no container, o server.ts cai automaticamente pra HTTP puro.
# BEHIND_PROXY=true ativa o redirect pra https:// baseado em X-Forwarded-Proto (ver
# src/server/force-https.ts) — sobrescreva com -e BEHIND_PROXY=false só pra testar o container
# isolado, sem proxy na frente.
ENV PORT=4300
ENV BEHIND_PROXY=true
EXPOSE 4300

CMD ["node", "dist/dashfinras-web/server/server.mjs"]
