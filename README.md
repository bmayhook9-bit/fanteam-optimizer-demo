# FanTeam Optimizer Demo

This repository contains a browser-based MVP for a FanTeam Daily Fantasy Sports lineup optimizer and a minimal Node.js backend for user authentication.

## Setup

```bash
npm install
```

### Running the backend

```bash
npm start
```

The server exposes `/auth/register` and `/auth/login` endpoints backed by SQLite.

### Using the demo

Open `index.html` in a browser. Free users can cycle through demo datasets. Uploading custom CSVs or importing projections requires logging in (tier `PRO` or above).

## User tiers

| Tier | Access |
|------|--------|
| FREE | Demo data only |
| PRO  | Upload CSV, import projections |

## Future structure

The project is scaffolded for migration to a full web application with dedicated `src/`, `server/`, and `tests/` directories.
