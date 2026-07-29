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
# VITE_API_BASE_URL vide (et non "non défini") : Vite substitue les import.meta.env au
# moment du build, une variable absente se retrouve compilée en littéral `undefined` et
# produit des URLs "undefined/api/...". Chaîne vide -> appels relatifs /api/..., relayés
# vers le backend par le bloc location /api/ de nginx.conf.template. L'image reste ainsi
# indépendante de l'environnement (cf. Mentora-managment-be/docs/04-deploiement.md §2.4).
ENV VITE_API_BASE_URL=""
RUN npm run build

# Stage runtime : Nginx de production (non-root)
FROM nginxinc/nginx-unprivileged:alpine AS runtime

# Mise à jour des paquets OS pour corriger les vulnérabilités Trivy (cf. Dockerfile backend)
USER root
RUN apk upgrade --no-cache
USER 101

COPY --from=build /app/dist /usr/share/nginx/html

# Rendu au démarrage du conteneur (et non copié tel quel dans conf.d/) : le point d'entrée
# nginx substitue ${BACKEND_ORIGIN} puis écrit le résultat dans /etc/nginx/conf.d/.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Adresse du backend vue depuis le conteneur frontend. Valeur par défaut = nom du service
# docker-compose ; en Kubernetes, surcharger avec le nom du Service backend
# (ex. http://rh-backend:8080). Le filtre garantit que seule cette variable est substituée
# dans le template, jamais les $uri/$host/$scheme de nginx.
ENV BACKEND_ORIGIN=http://backend:8080
# Renseigne NGINX_LOCAL_RESOLVERS depuis /etc/resolv.conf (DNS du cluster / du réseau
# Docker), utilisé par la directive `resolver` du template. Le script d'entrée de l'image
# sort immédiatement sans cette opt-in, et la variable resterait vide -> nginx refuse de
# démarrer. Vérifié en conteneur, ce n'est pas un réglage décoratif.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER=(BACKEND_ORIGIN|NGINX_LOCAL_RESOLVERS)

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]
