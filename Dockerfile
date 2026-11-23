# Étape 1 : build de l'application.
# Node, npm et les node_modules restent dans cette étape : ils n'arrivent pas dans l'image finale.
# Node 26 : version LTS active (maintenance à partir d'octobre 2027, fin de vie en avril 2029).
FROM node:26-alpine AS build

# Applique les correctifs Alpine parus depuis la publication de l'image de base, et met à jour
# npm dans sa version majeure : le npm fourni avec Node embarque des dépendances vulnérables
# (brace-expansion, undici) qui servent pendant npm ci.
RUN apk upgrade --no-cache && npm install --global --ignore-scripts npm@11

WORKDIR /app

COPY package*.json ./

# --ignore-scripts : aucun script d'installation de dépendance n'est exécuté
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

# Étape 2 : image finale, nginx sans root et les fichiers statiques.
FROM nginxinc/nginx-unprivileged:1.30-alpine

# Applique les correctifs parus depuis la publication de l'image de base, et retire curl,
# inutile ici (le healthcheck utilise le wget de busybox).
# nginx et ses modules viennent du dépôt nginx.org, absent de /etc/apk/repositories : il est
# ajouté pour cette commande seulement, sa clé de signature est fournie par l'image de base.
# L'image de base les épingle en version exacte (nginx=1.30.6-r1) : l'épinglage est relâché
# à la branche (nginx~1.30) pour recevoir les correctifs sans changer de version mineure.
USER root
RUN sed -i -E 's/^(nginx[^=]*)=([0-9]+\.[0-9]+)\..*$/\1~\2/' /etc/apk/world \
    && apk upgrade --no-cache \
        --repository "https://nginx.org/packages/alpine/v$(cut -d. -f1,2 /etc/alpine-release)/main" \
    && apk del --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:3000/ || exit 1
