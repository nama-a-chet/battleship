# Battleship Workspace

## Architecture Overview

This is a monorepo containing the Battleship web app and its backend:
- `frontend/` - React + Vite web application (deployed to **Vercel**)
- `backend/` - Flask REST API (deployed to **Render**)

## File Structure

```
frontend/                  # React + Vite
├── src/
│   ├── components/        # Game UI components + colocated CSS (incl. Admin)
│   ├── hooks/             # Custom React hooks (useGame, useGameStream)
│   ├── services/          # API client (game + admin endpoints)
│   ├── utils/             # Utilities (session persistence)
│   ├── types/             # TypeScript type definitions + constants
│   ├── icons/             # Icon barrel file (pixelarticons re-exports)
│   ├── styles/            # Shared styles (base, buttons, forms)
│   ├── App.tsx            # Root component (lobby UI + screen router + /admin)
│   ├── index.css          # CSS reset + theme variables
│   └── main.tsx           # Entry point
├── public/                # Static files (favicon, crosshair cursor)
├── vercel.json            # SPA rewrite rules (needed for /admin route)
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json
└── package.json

backend/                   # Flask API
├── main.py                # Flask app entry point
├── requirements.txt
├── Dockerfile
├── data/                  # Game history logs (gitignored, ephemeral on Render)
├── setup/                 # Config constants
├── game/                  # Game logic, models, AI, history logging
└── request_handlers/      # Route handlers (game + admin)
```

## Plans

When creating implementation plans, save them as markdown files in `claude_plans/` directories (gitignored). Use date-prefixed filenames for chronological sorting:
- `backend/claude_plans/YYYY-MM-DD_description.md`
- `frontend/claude_plans/YYYY-MM-DD_description.md`
- `claude_plans/YYYY-MM-DD_description.md` (top-level, cross-cutting plans)

## Frontend (React + Vite)

### Local Development

```bash
cd frontend
npm install
npm run dev
```

### Build

```bash
cd frontend
npm run build    # outputs to dist/
npm run preview  # preview production build locally
```

## Backend (Flask API)

### Local Development

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables (or use .env.local)
gunicorn main:app --bind 0.0.0.0:8084 --workers 1 --threads 20 --timeout 0
```

## Critical Rules

### No Direct API Calls from Components
All data access must go through `services/api.ts` on the frontend.

### No Database
All game state is in-memory and ephemeral. Game history is logged to a JSONL file on disk but is lost on server restart/redeploy. This is intentional — no database was set up for this project.

### Single Worker Required
The backend MUST run with `--workers 1` since all state is in-memory. Multiple workers would create isolated state islands.
