# Mentora-managment-fe

Frontend React + Vite + TypeScript du système de gestion RH pour HB Développement.

## Démarrage rapide

Ce repo doit être cloné **à côté** de son repo frère backend (pivot) :

```
workspace/
├── Mentora-managment-be/
└── Mentora-managment-fe/   <- ce repo
```

Le développement local (installation, hot reload, variables d'environnement)
est piloté depuis le repo backend : `cd ../Mentora-managment-be && docker
compose up` démarre aussi ce frontend (service `frontend` référencé depuis
son docker-compose).

Les types API (`src/types/api.ts`) sont générés depuis la spec OpenAPI du
backend via `npm run generate:types` — **jamais édités à la main**.
