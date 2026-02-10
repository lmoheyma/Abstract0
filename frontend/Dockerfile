# Frontend Vite - Development
FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8080

# Lancer le serveur de développement Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
