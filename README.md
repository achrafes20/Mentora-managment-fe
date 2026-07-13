# Mentora-managment-fe

Frontend React + Vite + TypeScript + Ant Design du système de gestion RH pour HB Développement.

## Démarrage rapide

Ce repo doit être cloné **à côté** de son repo frère backend (pivot) :

```
workspace/
├── Mentora-managment-be/
└── Mentora-managment-fe/   <- ce repo
```

### Option 1 : Démarrage global via Docker Compose depuis le Frontend

Vous pouvez démarrer toute la stack directement depuis ce dossier (Frontend) :

```bash
docker compose up --build
```

Cela démarrera :

- **rh_db** (PostgreSQL 14) sur le port `5432`
- **rh_backend** (Spring Boot 3.5) sur le port `8080`
- **rh_frontend** (Vite Dev Server) sur le port `5173` (accessible à [http://localhost:5173](http://localhost:5173))
- **rh_mailpit** (Mailpit SMTP + UI) sur le port `8025` pour visualiser les e-mails envoyés localement
- **rh_n8n** (Automation workflows) sur le port `5678`

### Option 2 : Démarrage local sans Docker (pour le dev rapide)

1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Créez votre fichier `.env` si ce n'est pas déjà fait :
   ```bash
   cp .env.example .env
   ```
3. Démarrez le serveur Vite localement :
   ```bash
   npm run dev
   ```

---

## 🛠️ Vérifications de code et build

- **Vérification des types TypeScript** :
  ```bash
  npm run typecheck
  ```
- **Formater le code** :
  ```bash
  npm run format
  ```
- **Générer les types à partir d'OpenAPI** :
  ```bash
  npm run generate:types
  ```
