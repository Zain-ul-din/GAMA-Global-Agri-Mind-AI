# global-agri-mind-ai 🌍🌱

### 🔗 Public Link
**[https://global-agri-mind-ai.onrender.com/](https://global-agri-mind-ai.onrender.com/)**

### 💻 GitHub Repository
**[https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI](https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI)**

An ecosystem design engine and intelligent garden planner. This system is designed to build sustainable, optimized planting layouts, companion recommendations, and planting timelines based on local climate data (such as USDA hardiness zones, soil types, and dimensions).

## Project Structure

- `web/`: Next.js app — UI, server functions (`data/` reads, `actions/` writes), map/health route handlers, and the Drizzle SQLite layer (`lib/db/`).
- `backend/`: Legacy FastAPI server (pending removal once the web UI lands).
- `database/`: Legacy Python seed (pending removal; use `pnpm db:seed` in `web/` instead).
- `frontend/`: Legacy vanilla-JS interface served by the old backend (pending migration to `web/`).
- `docs/`: Product designs, architectural blueprints, and setup documentation.

## Setup (Next.js + Drizzle)

### Prerequisites
- Node 20+
- `pnpm`

### Running the App

1. Navigate to the web directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create the database and seed the plant catalog:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000). Health check lives at `/api/health`.

### Useful commands (inside `web/`)

- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle schema workflow
- `pnpm db:seed` — rebuild the 227-plant + 844-relationship catalog
- `pnpm lint` — Biome check (must pass clean)

## 💖 Funding & Open Collective

We are preparing to launch our Open Collective page to support sustainable development and open-source contributions. 

* **Back Us**: Support the project on Open Collective (coming soon) to help sustain GAMA's development and cloud services!
* **Contribute**: Check out the official repository at [github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI](https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI) to get involved.
