# Étape 1 : build de l'application.
# Node, npm et les node_modules restent dans cette étape : ils n'arrivent pas dans l'image finale.
FROM node:26-alpine AS build

WORKDIR /app

COPY package*.json ./

# --ignore-scripts : aucun script d'installation de dépendance n'est exécuté
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

# Étape 2 : image finale, nginx sans root et les fichiers statiques.
FROM nginxinc/nginx-unprivileged:1.30-alpine

# Applique les correctifs Alpine parus depuis la publication de l'image de base,
# et retire curl, inutile ici (le healthcheck utilise le wget de busybox).
USER root
RUN apk upgrade --no-cache && apk del --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:3000/ || exit 1
