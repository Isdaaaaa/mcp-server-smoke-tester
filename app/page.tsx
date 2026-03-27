const checklist = [
  { name: "Endpoint reachable", status: "pending" },
  { name: "Handshake response", status: "pending" },
  { name: "Tool listing", status: "pending" },
  { name: "Basic invocation", status: "pending" }
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-mcp-slateBg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-mcp-blue">MCP Blueprints</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">MCP Server Smoke Tester</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            In development: a calm, developer-first dashboard to verify MCP server health before shipping.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Input</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-mono text-sm text-slate-700">server_url</p>
                <p className="mt-1 text-xs text-slate-500">https://your-server.example/mcp</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-mono text-sm text-slate-700">auth_token</p>
                <p className="mt-1 text-xs text-slate-500">••••••••••••••••••••••••••••</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist</h2>
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{item.name}</span>
                  <span className="rounded-full bg-mcp-blueSoft px-2 py-1 text-xs font-medium text-mcp-blue">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Report Preview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
              <p className="text-xs uppercase text-emerald-700">Pass</p>
              <p className="mt-1 font-mono text-xl font-semibold text-emerald-800">0</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-4 text-center">
              <p className="text-xs uppercase text-amber-700">Warnings</p>
              <p className="mt-1 font-mono text-xl font-semibold text-amber-800">0</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-center">
              <p className="text-xs uppercase text-rose-700">Failures</p>
              <p className="mt-1 font-mono text-xl font-semibold text-rose-800">0</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Smoke report output will appear here once server checks are wired.
          </div>
        </section>
      </div>
    </main>
  );
}
