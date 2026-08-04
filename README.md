# Mentora-managment-fe

Frontend React + Vite + TypeScript + Tailwind CSS (primitives Radix UI) du
système de gestion RH pour HB Développement.

## Démarrage rapide

Ce repo doit être cloné **à côté** de son repo frère backend (pivot) :

```
workspace/
├── Mentora-managment-be/   <- le docker-compose.yml vit ici
└── Mentora-managment-fe/   <- ce repo
```

### Option 1 : Stack complète via Docker Compose (recommandé)

**Le `docker-compose.yml` du projet vit dans `Mentora-managment-be`, pas
ici** — ce repo n'a pas son propre fichier compose, il n'est qu'un service
référencé par celui du backend (repo pivot). Démarrer depuis le repo
backend :

```bash
cd ../Mentora-managment-be
docker compose up --build
```

Démarre les 6 services : `db` (PostgreSQL 14), `backend` (Spring Boot,
port `8080`), `frontend` — **ce repo**, Vite dev server avec HMR (port
`5173`), `mailpit` (port `8025`), `n8n` (port `5678`, bootstrap manuel
requis au premier lancement) et `pgadmin` (port `8082`). Détail complet
dans le README du repo backend.

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

Le frontend seul ne suffit pas à grand-chose : `VITE_API_BASE_URL`
(`.env`, `http://localhost:8080` par défaut) doit pointer vers un backend
réellement démarré (Option 1, ou lancé séparément côté
`Mentora-managment-be`) pour que les écrans branchés sur la vraie API
fonctionnent.

## Carte du dépôt

```
src/
├── app/          Layout général, sidebar (modules.ts), router, providers
├── features/     Un dossier par module métier, mirroir du backend :
│   ├── auth/           Login, gestion des comptes, reset mot de passe
│   ├── employee/       Employés, départements, import Excel/CSV
│   ├── attendance/     Pointages, anomalies, horaires, kiosque QR
│   ├── recruitment/    Offres, pipeline candidatures, analyse IA
│   ├── admin-requests/ Demandes (congés, bons de sortie), jours fériés
│   ├── documents/      Certificats, file de surveillance
│   ├── config/         Identité entreprise
│   ├── audit/          Consultation du journal d'audit
│   ├── delegation/     Délégation temporaire d'approbation
│   ├── dashboard/      Tableau de bord (backend pas encore livré, T5.A1)
│   └── notifications/  Centre de notifications in-app
├── components/ui/ Primitives partagées (Dialog, Select, DatePicker,
│                  FormField, Button, toast, confirm...) — remplacent
│                  Ant Design (retiré le 2026-07-15). Un composant y monte
│                  seulement quand une **deuxième** feature en a besoin.
├── lib/          Client API (axios + intercepteur token), AuthContext,
│                 NotifContext, downloadBlob, featureFlags.ts
├── styles/       theme.css (tokens de marque en CSS custom properties,
│                 source unique — voir components/ui/tokens.ts pour leur
│                 usage hors className)
└── types/api.ts  Généré depuis l'OpenAPI du backend — **jamais éditer à
                  la main**, régénérer avec `npm run generate:types`
```

`src/lib/featureFlags.ts` contrôle quels écrans utilisent la vraie API
vs des données de démonstration (`MockBanner` visible tant que le flag
est `false`) — utile pour savoir si un écran vide/étrange est un vrai bug
ou juste un module pas encore branché.

## Tâches courantes

| Tâche                            | Commande                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Lancer en dev (sans Docker)      | `npm run dev`                                                                                                                     |
| Vérifier les types               | `npm run typecheck`                                                                                                               |
| Lint                             | `npm run lint`                                                                                                                    |
| Formater le code                 | `npm run format` (`npm run format:check` en CI, sans écrire)                                                                      |
| Lancer les tests                 | `npm run test` (Vitest) ou `npm run test:watch`                                                                                   |
| Build de production              | `npm run build`                                                                                                                   |
| Régénérer les types depuis l'API | `npm run generate:types` — nécessite `../Mentora-managment-be/contracts/openapi.json` à jour (`make openapi-export` côté backend) |

## CI/CD en 5 lignes

- **`ci.yml`** (push/PR sur `main`) : job `build-test` — `format:check`,
  `lint`, `typecheck`, `test` (Vitest), `build` ; job `trivy` — scan de
  vulnérabilités des dépendances (`fs`, CRITICAL/HIGH, échoue le build).
- **`release.yml`** (push sur `main`) : build l'image Docker multi-stage
  (Nginx non-root en prod) et la scanne avec Trivy (`image`,
  CRITICAL/HIGH). **Ne pousse pas encore vers un registre** — GHCR
  retenu, pas encore implémenté.
- Pas de CodeQL/SAST — retiré (licence GitHub Advanced Security non
  budgétée sur repo privé) ; à revoir en T6.4 (durcissement).
