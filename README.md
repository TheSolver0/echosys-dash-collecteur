# EchoSys — Dashboard Collecteur

Dashboard React + Vite + TypeScript + Tailwind pour les agents collecteurs ECHOSYS.

## Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router 6
- Recharts (graphiques)
- Lucide React (icônes)
- Axios (API)
- date-fns (dates)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'API
cp .env.example .env
# Éditer VITE_API_URL si nécessaire

# 3. Lancer en développement
npm run dev
# → http://localhost:5174

# 4. Build production
npm run build
```

## Routes backend utilisées

| Route | Description |
|---|---|
| `POST /auth/login` | Connexion (vérifie role === COLLECTEUR) |
| `GET /reports/my-missions` | Missions assignées au collecteur connecté |
| `PATCH /reports/:id/accept` | Accepter une mission |
| `PATCH /reports/:id/resolve` | Valider avec photo + GPS (multipart/form-data) |
| `GET /reports/:id` | Détail d'une mission |
| `GET /conversations` | Conversations du collecteur |
| `GET /conversations/:id` | Détail + messages |
| `POST /conversations/:id/messages` | Envoyer un message |

## Structure

```
src/
  api/          → client Axios + intercepteurs JWT
  components/   → Layout, Header, StatCard, MissionBadge
  context/      → AuthContext (token + user)
  pages/        → Dashboard, Missions, MissionDetail, Historique, Messages, Carte
  types/        → Interfaces TypeScript partagées
```

## À brancher côté backend NestJS

La route `GET /reports/my-missions` doit filtrer par `assignedTo = req.user.id`.

La route `PATCH /reports/:id/resolve` reçoit :
- `photo` (File, multipart)
- `latitude` (string)
- `longitude` (string)

Et enregistre `proofPhotoUrl`, `proofLatitude`, `proofLongitude` sur le Report.
