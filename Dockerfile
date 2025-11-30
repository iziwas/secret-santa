# Utiliser l'image Node.js Alpine (légère)
FROM node:22-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier tous les fichiers du projet
COPY . .

# Builder l'application
RUN npm run build

# Installer 'serve' pour servir les fichiers statiques
RUN npm install -g serve

# Exposer le port 3000
EXPOSE 3000

# Démarrer l'application avec serve
CMD ["serve", "-s", "dist", "-l", "3000"]