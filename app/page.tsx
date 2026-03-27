export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-bg px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex rounded-full border border-mcp-blueSoft bg-mcp-blueSoft px-3 py-1 font-mono text-xs font-medium text-mcp-blue">
            Bootstrap slice
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">MCP Server Smoke Tester</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            A calm, confidence-first interface for quickly checking MCP server health.
          </p>
        </header>

        <section className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Server Setup</h2>
          <p className="mt-1 text-sm text-slate-600">Enter your endpoint and optional auth token to begin testing.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-surface-border bg-slate-50 p-4 text-sm text-slate-500">
              Server URL input placeholder
            </div>
            <div className="rounded-xl border border-dashed border-surface-border bg-slate-50 p-4 text-sm text-slate-500">
              Auth token input placeholder
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-sm">
            <h3 className="font-medium">Checklist</h3>
            <p className="mt-2 text-sm text-slate-600">Design-ready slot for connection checks and capability probes.</p>
          </article>
          <article className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-sm">
            <h3 className="font-medium">Report</h3>
            <p className="mt-2 text-sm text-slate-600">Pass/fail summary styled like a lightweight CI status card.</p>
          </article>
          <article className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
            <h3 className="font-medium">Share Actions</h3>
            <p className="mt-2 text-sm text-slate-600">Sticky action area placeholder for copy/share and rerun controls.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
