# MCP Server Smoke Tester

Bootstrap Next.js app (App Router + TypeScript + Tailwind + ESLint) for building a streamlined MCP server smoke testing UI.

Current UI wiring includes local form state + Zod validation for auth modes (`none`, `bearer`, `custom-header`) with readiness feedback. Network execution is intentionally deferred to later slices.

## Requirements

- Node.js 18.18+ (Node 20+ recommended)
- pnpm 9+

## Install

```bash
pnpm install
```

## Run in development

```bash
pnpm dev
```

Then open <http://localhost:3000>.

## Current slice behavior (auth wiring)

The setup form is now fully client-wired with Zod validation:
- Server URL validation with inline errors
- Auth mode selector (`none`, `bearer`, `custom-header`)
- Conditional credential inputs based on selected mode
- Readiness card that reflects whether URL + auth configuration are valid

No network requests are sent yet; the Run button currently validates state only.

## Quality checks

```bash
pnpm lint
pnpm typecheck
```

## Production build

```bash
pnpm build
pnpm start
```
