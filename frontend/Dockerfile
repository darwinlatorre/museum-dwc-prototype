# ========================================================================
# BASE — dependencias npm
# ========================================================================
FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund


# ========================================================================
# DEVELOPMENT — Angular CLI con hot reload
# ========================================================================
FROM base AS development

COPY . .

EXPOSE 4200

CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "1000", "--proxy-config", "proxy.docker.conf.json"]


# ========================================================================
# BUILD — compilación Angular
# ========================================================================
FROM base AS build

COPY . .
RUN npm run build -- --configuration production


# ========================================================================
# PRODUCTION — archivos compilados y licencias
# ========================================================================
FROM nginx:1.28-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser/ /usr/share/nginx/html/
COPY --from=build /app/dist/frontend/3rdpartylicenses.txt /usr/share/nginx/html/3rdpartylicenses.txt

EXPOSE 80
