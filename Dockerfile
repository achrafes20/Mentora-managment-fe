# Stage dev : local via docker-compose (rh-backend), source bind-montée, HMR Vite.
# Ne participe pas au build par défaut (docker/build-push-action et `docker build` sans
# --target prennent le dernier stage défini, donc "runtime" reste la cible release/CI).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Stage build : bundle de production
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage runtime : Nginx de production (non-root)
FROM nginxinc/nginx-unprivileged:alpine AS runtime

# Mise à jour des paquets OS pour corriger les vulnérabilités Trivy (cf. Dockerfile backend)
USER root
RUN apk upgrade --no-cache
USER 101

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
