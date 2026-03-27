# MCP Server Smoke Tester

A small web app and test runner that probes MCP-compatible servers for practical readiness: capabilities, authentication flows, tool contract validation, invocation correctness, and latency. Produces a shareable markdown report and badge suitable for portfolio demos or CI checks.

Core features

- Input MCP server URL and optional auth credentials
- Selectable auth/login flows for common schemes (API key, Bearer, OAuth demo)
- Guided checklist of probes validating capabilities, tool schemas, and invocation behavior
- Test runner (Node/TypeScript) that executes probes and records pass/fail with details and timing
- Markdown and badge output for sharing results; demo fixtures and mocked servers included for reproducible examples

Why it matters

Agent ecosystems require interoperable servers. This tool helps developers and platform engineers quickly validate that a server implements the expected MCP contracts and runtime behaviors, reducing integration friction and improving DX.

Setup

Prerequisites:

- Node.js 18+ and npm/yarn
- Docker (for running demo mock servers)

Local dev

1. Install dependencies:

   npm install

2. Start the dev server:

   npm run dev

3. Open the app at http://localhost:3000 and provide a server URL or run the included demo fixtures with Docker Compose:

   docker compose up --build

Running tests

- The test runner is in packages/runner (TypeScript). Build and run:

  cd packages/runner
  npm run build
  npm start -- --target <server-url>

Showcase notes

- Includes mocked broken cases for demonstration (see /fixtures)
- Example run outputs are in /examples as Markdown snapshots and badge images

Limitations

- Not a full protocol certification system; intended for pragmatic smoke checks and developer feedback
- Auth flows are demo-grade — production deployments should secure secrets and use proper OAuth flows

License

MIT
