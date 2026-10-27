# syntax=docker/dockerfile:1

# ---- Build : bundle Vite statique ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# L'URL de l'API est figée au build (Vite). Par défaut, chemin relatif :
# le front et l'API sont servis derrière le même Ingress.
ARG VITE_API_BASE_URL=/api
ARG VITE_ENV_LABEL=KUBERNETES
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_ENV_LABEL=${VITE_ENV_LABEL}
RUN npm run build

# ---- Runtime : nginx non-root ----
FROM nginxinc/nginx-unprivileged:1.30-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# vite.config.ts fixe base: '/HomiByIsphers/'
COPY --from=build /app/dist /usr/share/nginx/html/HomiByIsphers

EXPOSE 8080
USER 101
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
