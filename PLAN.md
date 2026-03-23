# MCP Server Smoke Tester

## Summary
A web app to validate MCP servers against a real-world capabilities checklist, with shareable compliance reports and a badge score for open repos.

## Target User
AI platform/dev infra teams, agent developer tool builders, protocol integrators.

## Portfolio Positioning
Highlights agent protocol depth, fast MVP execution, and developer empathy.

## MVP Scope
- Paste an MCP URL
o Guided auth, capability, route checks
o Markdown report+badge

## Non-goals
- Full cert suite, deep coverage of evolving agent extensions

## Technical Approach
Next.js+TypeScript app, Node-based probe worker, output SQLite/markdown. Focus on scriptable, reliable core test APIs.

## Execution Notes
Start with protocol snapshot, anchor each phase to real-world usage, document breakage and fix flows in demos.