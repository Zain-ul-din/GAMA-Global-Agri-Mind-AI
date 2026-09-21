# Contributing to GAMA

Welcome! We are thrilled that you are interested in contributing to GAMA (Global Agri-Mind AI). Contributions from the community help make GAMA a better tool for sustainable agriculture, permaculture, and urban farming.

## How to Contribute

### 1. Reporting Bugs & Suggesting Features
* Open an issue in our GitHub Repository.
* Provide a clear description of the issue or the proposed feature.
* Include screenshots, code examples, or steps to reproduce where applicable.

### 2. Developing Code
* **Fork** our repository and create a new branch from `main`.
* **Web Development**:
  * Located under `web/`.
  * Built with Next.js (App Router), TypeScript, and Drizzle ORM (SQLite).
  * Reads live in `web/data/` (`get-*.ts`, one named export per file).
  * Writes/computations live in `web/actions/` (`create-*/update-*/record-*.ts`, `'use server'`, one named export per file).
  * Binary proxies (map tiles, static maps) and `/api/health` live in `web/app/api/`.
  * DB schema lives in `web/lib/db/schema.ts`; never edit the DB without a `drizzle-kit generate` migration.
* **Frontend Development**:
  * The garden UI is being migrated from legacy vanilla HTML/JS (`frontend/`) into `web/`.
  * Uses Three.js for 3D visualization.
* Keep your code clean, concise, and well-documented.

### 3. Testing Your Changes
* Run typecheck and lint inside `web/` — both must pass:
  ```bash
  cd web
  npx tsc --noEmit
  pnpm lint
  ```
* After schema changes, verify the seed still produces parity:
  ```bash
  pnpm db:push && pnpm db:seed
  ```
  (expect 227 plants / 844 relationships).

### 4. Submitting a Pull Request (PR)
* Push your branch to your forked repository and submit a PR to our `main` branch.
* Ensure your PR has a descriptive title and links to any related issues.
* Wait for review from the GAMA maintainers team.

## Getting in Touch
* Join our community channels or open a discussion on GitHub to talk about ideas and seek help!
