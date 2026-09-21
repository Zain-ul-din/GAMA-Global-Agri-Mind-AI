# global-agri-mind-ai 🌍🌱

### 🔗 Public Link
**[https://global-agri-mind-ai.onrender.com/](https://global-agri-mind-ai.onrender.com/)**

### 💻 GitHub Repository
**[https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI](https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI)**

An ecosystem design engine and intelligent garden planner. This system is designed to build sustainable, optimized planting layouts, companion recommendations, and planting timelines based on local climate data (such as USDA hardiness zones, soil types, and dimensions).

## Project Structure

- `src/`: Next.js application code — routes, UI, server functions, data reads, and the Drizzle database layer.
- Repository root: Tooling, migrations, tests, scripts, environment files, and static `public/` assets.
- `legacy/frontend/`: Preserved vanilla-JS interface from before the Next.js migration.
- `docs/`: Product designs, architectural blueprints, and setup documentation.

## Setup (Next.js + Drizzle)

### Prerequisites
- Node 20+
- `pnpm`

### Running the App

1. Install dependencies from the repository root:
   ```bash
   pnpm install
   ```
2. Create the database and seed the plant catalog:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). Health check lives at `/api/health`.

### Useful commands

- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle schema workflow
- `pnpm db:seed` — rebuild the 227-plant + 844-relationship catalog
- `pnpm lint` — Biome check (must pass clean)
- `pnpm typecheck` — TypeScript validation
- `pnpm test` / `pnpm test:e2e` — unit and browser tests

## 💖 Funding & Open Collective

We are preparing to launch our Open Collective page to support sustainable development and open-source contributions. 

* **Back Us**: Support the project on Open Collective (coming soon) to help sustain GAMA's development and cloud services!
* **Contribute**: Check out the official repository at [github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI](https://github.com/GAMA-Global-Agri-Mind-AI/GAMA-Global-Agri-Mind-AI) to get involved.
