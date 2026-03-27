# MCP Server Smoke Tester

Bootstrap Next.js app (App Router + TypeScript + Tailwind + ESLint) for building a streamlined MCP server smoke testing UI.

Current UI wiring includes local form state + Zod validation for auth modes (`none`, `bearer`, `custom-header`) with readiness feedback and a runnable smoke probe report.

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

## Current slice behavior (smoke probe)

The setup form is client-wired with Zod validation and an executable smoke probe:
- Server URL validation with inline errors
- Auth mode selector (`none`, `bearer`, `custom-header`)
- Conditional credential inputs based on selected mode
- Run button that performs best-effort MCP JSON-RPC checks (`initialize`, `tools/list`, `tools/call` sample invocations)
- Dedicated `tools/list` contract validation check for tool metadata shape (`name`, optional `description`, `inputSchema`)
- Sample invocation runner that picks up to 2 tools and sends safe arguments derived from obvious required defaults/enums (falls back to `{}`)
- Structured report cards showing pass/fail, latency, HTTP status, contract findings, invocation findings, and fallback notes
- Gist-ready markdown report generation from probe results + selected auth mode (auth values redacted), including summary score, per-check details, contract/invocation findings, and notes
- Report actions after each run: copy markdown report to clipboard or download a `.md` file
- Badge output + sharing actions: copy badge markdown, direct badge URL, or HTML `<img>` snippet

Auth behavior for probe requests:
- `none`: no auth header sent
- `bearer`: `Authorization: Bearer <token>`
- `custom-header`: `<name>: <value>`

## Badge output and sharing

After a probe run, the report area includes a badge preview and copy actions:
- **Copy badge markdown** → `![MCP smoke status: X/Y pass](https://img.shields.io/...)`
- **Copy badge URL** → direct `img.shields.io` link for dashboards
- **Copy badge HTML** → `<img src="..." alt="MCP smoke status: X/Y pass" />`

Badge color mapping:
- All checks pass: `brightgreen`
- Partial pass: `yellow`
- No checks pass: `red`

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
