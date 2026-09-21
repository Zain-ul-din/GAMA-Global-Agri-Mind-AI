# Next.js application

The production application code lives under `src/`, while configuration,
migrations, tests, scripts, environment files, and `public/` assets remain at
the repository root. It uses Next.js, React, TypeScript, Drizzle SQLite, and the
shadcn/ui preset configured in `components.json`.

## Local development

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`; the root route redirects to `/design`.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The previous vanilla frontend is retained in `legacy/frontend/` as a read-only
reference for later migration audits.
