# MCP Server Smoke Tester

A bootstrap Next.js app for an in-development MCP server smoke testing dashboard.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zod
- ESLint

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Run in development

```bash
pnpm dev
```

Then open http://localhost:3000.

### 3) Lint and typecheck

```bash
pnpm lint
pnpm typecheck
```

### 4) Build and run production

```bash
pnpm build
pnpm start
```

## Project Structure

- `app/` - UI shell and global styles
- `lib/schemas.ts` - shared Zod schema/type for smoke test input

## Current Status

Bootstrap scaffold is complete. Functional smoke-test flows are intentionally pending.
