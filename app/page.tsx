export default function HomePage() {
  const checklistItems = [
    'Server URL is reachable over HTTPS',
    'Authentication header is accepted',
    'tools/list returns a valid payload',
    'Server responds within expected latency budget',
  ];

  return (
    <main className="min-h-screen bg-surface-bg px-4 py-8 text-slate-900 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-mcp-blueSoft bg-white px-3 py-1 font-mono text-xs font-medium text-mcp-blue shadow-sm">
            <span className="h-2 w-2 rounded-full bg-mcp-blue" aria-hidden />
            Setup + readiness preview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">MCP Server Smoke Tester</h1>
          <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
            Calm, confidence-first setup for validating a server before running smoke checks. Fill the form,
            review readiness, then start a test run.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:items-start">
          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">1) Server setup</h2>
                <p className="mt-1 text-sm text-slate-600">Enter connection details. Inputs are visual for this slice.</p>
              </div>
              <span
                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                title="No requests are sent yet in this slice."
              >
                Visual only
              </span>
            </div>

            <form className="space-y-4" aria-label="Server setup form">
              <div className="space-y-2">
                <label htmlFor="server-url" className="text-sm font-medium text-slate-800">
                  Server URL
                </label>
                <div className="relative">
                  <input
                    id="server-url"
                    name="server-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://your-mcp-server.example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                    aria-describedby="server-url-help"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                    title="Prefer HTTPS endpoints for production checks."
                  >
                    URL
                  </span>
                </div>
                <p id="server-url-help" className="text-xs text-slate-500">
                  Tip: include protocol and port if needed (e.g. https://localhost:8080).
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-token" className="text-sm font-medium text-slate-800">
                  Auth token <span className="text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-token"
                    name="auth-token"
                    type="password"
                    placeholder="mcp_pat_..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-20 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                    aria-describedby="auth-token-help"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                    title="Used as an Authorization bearer token in future slices."
                  >
                    Why?
                  </span>
                </div>
                <p id="auth-token-help" className="text-xs text-slate-500">
                  Leave blank for public endpoints or local dev servers without auth.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
                This slice focuses on layout and UX only. Actual network test execution will be wired in later slices.
              </div>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-mcp-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              >
                Run smoke test
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">2) Readiness checklist</h2>
            <p className="mt-1 text-sm text-slate-600">Pass/fail framing before results stream in.</p>

            <ul className="mt-4 space-y-2" aria-label="Readiness checklist preview">
              {checklistItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs text-slate-500">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              ✅ Ready to evaluate once credentials and endpoint are provided.
            </div>
          </article>

          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">3) Report area</h2>
            <p className="mt-1 text-sm text-slate-600">Designed empty and loading states (no spinner-only fallback).</p>

            <div className="mt-4 space-y-3">
              <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Empty state</p>
                <p className="mt-1 text-xs text-slate-500">
                  No run yet. Add server details and start a smoke test to generate a pass/fail report.
                </p>
              </section>

              <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-blue-900">Loading state preview</p>
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] text-blue-700">running</span>
                </div>
                <div className="mt-3 space-y-2" aria-hidden>
                  <div className="h-2 w-4/5 rounded bg-blue-100" />
                  <div className="h-2 w-3/5 rounded bg-blue-100" />
                  <div className="h-2 w-2/3 rounded bg-blue-100" />
                </div>
              </section>

              <section className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                ⚠️ If checks fail, this panel will surface actionable diagnostics and next-step hints.
              </section>
            </div>
          </article>
        </section>

        <footer className="sticky bottom-3 z-10 rounded-2xl border border-surface-border bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600 sm:text-sm">
              Share/report actions will live here for quick reruns, copy summary, and export.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Copy summary
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
              >
                Export report
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
