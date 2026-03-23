# MCP Server Smoke Tester - Project Plan

## Project Summary
A web app that validates any MCP server against a practical checklist (capabilities, auth, tool contracts, and latency) and outputs a shareable readiness report.

## Target User
Developers working on MCP-compatible servers, API tool teams, DevOps, and platform engineers.

## Portfolio Positioning
Demonstrates developer tooling, protocol-level debugging, and practical DX-focused design for modern agent infra.

## MVP Scope
- Input MCP server URL
- Auth/login selection
- Guided test checklist (capabilities, schemas, invocation)
- Easy pass/fail markers and markdown report

## Non-Goals
- Full protocol certification
- Automated fix/patch systems

## Technical Approach
- Next.js frontend, Node test runner coordinator (TypeScript), Zod for schemas, Tailwind UI, SQLite/optional Postgres
- Docker compose/dev fixtures for MCP mock servers

## Execution Notes
- Ship with mocked/broken cases and replayable runs for demo/reporting
- Focus on clear UX and report outputs (markdown, badge)