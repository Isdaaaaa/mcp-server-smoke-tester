'use client';

import { useMemo, useState } from 'react';
import { runSmokeProbe } from '@/lib/probe/smokeProbe';
import type { SmokeProbeResult } from '@/lib/probe/types';
import { buildSmokeBadge } from '@/lib/report/badge';
import { buildMarkdownReport } from '@/lib/report/markdown';
import { defaultServerInput, serverInputSchema, type ServerInput } from '@/lib/schemas/serverInput';

const checklistItems = [
  'Server URL is reachable over HTTPS',
  'Authentication header is accepted',
  'tools/list returns a valid payload',
  'Server responds within expected latency budget',
];

const authModeLabel: Record<ServerInput['authMode'], string> = {
  none: 'No auth',
  bearer: 'Bearer token',
  'custom-header': 'Custom header',
};

export default function HomePage() {
  const [form, setForm] = useState<ServerInput>(defaultServerInput);
  const [isRunning, setIsRunning] = useState(false);
  const [probeResult, setProbeResult] = useState<SmokeProbeResult | null>(null);
  const [runInput, setRunInput] = useState<ServerInput | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');
  const [badgeCopyState, setBadgeCopyState] = useState<'idle' | 'done' | 'error'>('idle');

  const validation = useMemo(() => serverInputSchema.safeParse(form), [form]);

  const fieldErrors = useMemo(() => {
    if (validation.success) {
      return {} as Partial<Record<keyof ServerInput, string>>;
    }

    const flattened = validation.error.flatten().fieldErrors;
    return {
      serverUrl: flattened.serverUrl?.[0],
      bearerToken: flattened.bearerToken?.[0],
      customHeaderName: flattened.customHeaderName?.[0],
      customHeaderValue: flattened.customHeaderValue?.[0],
    } as Partial<Record<keyof ServerInput, string>>;
  }, [validation]);

  const readinessItems = useMemo(
    () => [
      {
        label: 'Server URL looks valid',
        pass: Boolean(form.serverUrl.trim()) && !fieldErrors.serverUrl,
      },
      {
        label: 'Auth configuration is complete',
        pass:
          form.authMode === 'none'
            ? true
            : form.authMode === 'bearer'
              ? Boolean(form.bearerToken.trim()) && !fieldErrors.bearerToken
              : Boolean(form.customHeaderName.trim()) &&
                Boolean(form.customHeaderValue.trim()) &&
                !fieldErrors.customHeaderName &&
                !fieldErrors.customHeaderValue,
      },
      {
        label: checklistItems[2],
        pass: validation.success,
      },
      {
        label: checklistItems[3],
        pass: validation.success,
      },
    ],
    [form, fieldErrors, validation.success],
  );

  const passCount = readinessItems.filter((item) => item.pass).length;
  const isReady = validation.success;

  const markdownReport = useMemo(() => {
    if (!probeResult || !runInput) {
      return '';
    }

    return buildMarkdownReport(runInput, probeResult);
  }, [probeResult, runInput]);

  const badge = useMemo(() => {
    if (!probeResult) {
      return null;
    }

    return buildSmokeBadge(probeResult);
  }, [probeResult]);

  async function handleRunProbe() {
    if (!validation.success || isRunning) {
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setCopyState('idle');
    setBadgeCopyState('idle');

    const submittedInput = { ...validation.data };

    try {
      const result = await runSmokeProbe(submittedInput);
      setProbeResult(result);
      setRunInput(submittedInput);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Unexpected error while running probe.');
      setProbeResult(null);
      setRunInput(null);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopyMarkdown() {
    if (!markdownReport) {
      return;
    }

    try {
      await navigator.clipboard.writeText(markdownReport);
      setCopyState('done');
    } catch {
      setCopyState('error');
    }
  }

  async function handleCopyBadge(kind: 'markdown' | 'url' | 'html') {
    if (!badge) {
      return;
    }

    const payload =
      kind === 'markdown' ? badge.markdownSnippet : kind === 'url' ? badge.badgeUrl : badge.htmlSnippet;

    try {
      await navigator.clipboard.writeText(payload);
      setBadgeCopyState('done');
    } catch {
      setBadgeCopyState('error');
    }
  }

  function handleDownloadMarkdown() {
    if (!markdownReport) {
      return;
    }

    const blob = new Blob([markdownReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    anchor.href = url;
    anchor.download = `mcp-smoke-report-${timestamp}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

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
            Configure endpoint auth with confidence, then run a resilient smoke probe for MCP basics.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:items-start">
          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">1) Server setup</h2>
                <p className="mt-1 text-sm text-slate-600">Auth flow is wired and validated on-device.</p>
              </div>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Probe enabled
              </span>
            </div>

            <form className="space-y-4" aria-label="Server setup form">
              <div className="space-y-2">
                <label htmlFor="server-url" className="text-sm font-medium text-slate-800">
                  Server URL
                </label>
                <input
                  id="server-url"
                  type="url"
                  value={form.serverUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, serverUrl: event.target.value }))}
                  placeholder="https://your-mcp-server.example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-slate-500">Include protocol and port if needed.</p>
                {fieldErrors.serverUrl && <p className="text-xs text-rose-700">{fieldErrors.serverUrl}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-mode" className="text-sm font-medium text-slate-800">
                  Auth mode
                </label>
                <select
                  id="auth-mode"
                  value={form.authMode}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, authMode: event.target.value as ServerInput['authMode'] }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                >
                  <option value="none">No auth</option>
                  <option value="bearer">Bearer token</option>
                  <option value="custom-header">Custom header</option>
                </select>
              </div>

              {form.authMode === 'bearer' && (
                <div className="space-y-2">
                  <label htmlFor="bearer-token" className="text-sm font-medium text-slate-800">
                    Bearer token
                  </label>
                  <input
                    id="bearer-token"
                    type="password"
                    value={form.bearerToken}
                    onChange={(event) => setForm((prev) => ({ ...prev, bearerToken: event.target.value }))}
                    placeholder="mcp_pat_..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.bearerToken && <p className="text-xs text-rose-700">{fieldErrors.bearerToken}</p>}
                </div>
              )}

              {form.authMode === 'custom-header' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="header-name" className="text-sm font-medium text-slate-800">
                      Header name
                    </label>
                    <input
                      id="header-name"
                      value={form.customHeaderName}
                      onChange={(event) => setForm((prev) => ({ ...prev, customHeaderName: event.target.value }))}
                      placeholder="X-API-Key"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {fieldErrors.customHeaderName && (
                      <p className="text-xs text-rose-700">{fieldErrors.customHeaderName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="header-value" className="text-sm font-medium text-slate-800">
                      Header value
                    </label>
                    <input
                      id="header-value"
                      type="password"
                      value={form.customHeaderValue}
                      onChange={(event) => setForm((prev) => ({ ...prev, customHeaderValue: event.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-mcp-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {fieldErrors.customHeaderValue && (
                      <p className="text-xs text-rose-700">{fieldErrors.customHeaderValue}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800">
                Active mode: <span className="font-semibold">{authModeLabel[form.authMode]}</span>. Probe sends MCP JSON-RPC
                initialize + tools/list requests.
              </div>

              <button
                type="button"
                disabled={!isReady || isRunning}
                onClick={handleRunProbe}
                className="inline-flex w-full items-center justify-center rounded-xl bg-mcp-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isRunning ? 'Running smoke probe…' : 'Run smoke probe'}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">2) Readiness checklist</h2>
            <p className="mt-1 text-sm text-slate-600">Computed from current auth and endpoint config.</p>

            <ul className="mt-4 space-y-2" aria-label="Readiness checklist">
              {readinessItems.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    item.pass
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs">
                    {item.pass ? '✓' : '•'}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>

            <div
              className={`mt-4 rounded-xl border p-3 text-xs ${
                isReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {isReady
                ? `✅ Ready (${passCount}/${readinessItems.length}) — configuration can run the smoke probe.`
                : `⚠️ Not ready (${passCount}/${readinessItems.length}) — resolve highlighted fields.`}
            </div>
          </article>

          <article className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">3) Report area</h2>
            <p className="mt-1 text-sm text-slate-600">Probe outcomes with pass/fail checks and latency.</p>

            <div className="mt-4 space-y-3">
              {!isRunning && !probeResult && !runError && (
                <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Empty state</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Run the smoke probe to see endpoint reachability, initialize handshake, tools/list capability, and sample tools/call checks.
                  </p>
                </section>
              )}

              {isRunning && (
                <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-sm font-medium text-blue-900">Running probe…</p>
                  <p className="mt-1 text-xs text-blue-700">Sending MCP requests and collecting structured results.</p>
                  <div className="mt-3 space-y-2" aria-hidden>
                    <div className="h-2 w-4/5 animate-pulse rounded bg-blue-100" />
                    <div className="h-2 w-3/5 animate-pulse rounded bg-blue-100" />
                    <div className="h-2 w-2/3 animate-pulse rounded bg-blue-100" />
                  </div>
                </section>
              )}

              {runError && (
                <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                  <p className="text-sm font-medium">Probe failed to run</p>
                  <p className="mt-1 text-xs">{runError}</p>
                </section>
              )}

              {probeResult && (
                <>
                  <section
                    className={`rounded-xl border p-4 ${
                      probeResult.summary.passCount === probeResult.summary.totalCount
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      Result: {probeResult.summary.passCount}/{probeResult.summary.totalCount} checks passed
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      Total latency: <span className="font-mono">{probeResult.totalLatencyMs}ms</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600" title={probeResult.endpoint}>
                      Endpoint: {probeResult.endpoint}
                    </p>
                  </section>

                  {badge && (
                    <section className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-700">Badge output</p>
                      <p className="mt-1 text-[11px] text-slate-600">Share this run as a status badge in README, docs, or dashboards.</p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <img src={badge.badgeUrl} alt={badge.altText} className="h-5" />
                        <span className="text-[11px] font-mono text-slate-700">{badge.message}</span>
                      </div>
                    </section>
                  )}

                  <section className="sticky bottom-3 z-10 rounded-xl border border-mcp-blueSoft bg-blue-50/90 p-3 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMarkdown}
                        className="rounded-lg bg-mcp-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        Copy markdown report
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadMarkdown}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50"
                      >
                        Download .md
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyBadge('markdown')}
                        disabled={!badge}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Copy badge markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyBadge('url')}
                        disabled={!badge}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Copy badge URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyBadge('html')}
                        disabled={!badge}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Copy badge HTML
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {copyState === 'done' && <span className="text-emerald-700">Report markdown copied.</span>}
                      {copyState === 'error' && <span className="text-rose-700">Report copy failed. Use download.</span>}
                      {badgeCopyState === 'done' && <span className="text-emerald-700">Badge snippet copied.</span>}
                      {badgeCopyState === 'error' && <span className="text-rose-700">Badge copy failed.</span>}
                    </div>
                    <p className="mt-2 text-[11px] text-blue-900">Gist-ready report plus shareable Shields-style badge output.</p>
                  </section>

                  <details className="rounded-xl border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                      Preview markdown report
                    </summary>
                    <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] text-slate-100">
                      {markdownReport}
                    </pre>
                  </details>

                  <ul className="space-y-2" aria-label="Probe result checks">
                    {probeResult.checks.map((check) => (
                      <li
                        key={check.id}
                        className={`rounded-xl border p-3 ${
                          check.pass ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{check.label}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              check.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {check.pass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-700">{check.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          {typeof check.statusCode === 'number' && (
                            <span>
                              HTTP: <span className="font-mono">{check.statusCode}</span>
                            </span>
                          )}
                          <span>
                            Latency: <span className="font-mono">{check.latencyMs ?? 'n/a'}ms</span>
                          </span>
                        </div>
                        {check.contractFindings && check.contractFindings.length > 0 && (
                          <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
                            {check.contractFindings.slice(0, 3).map((finding) => {
                              const title = finding.name
                                ? `${finding.name} (index ${finding.index})`
                                : `Tool index ${finding.index}`;
                              return (
                                <li key={`${finding.index}-${finding.name ?? 'unnamed'}`}>
                                  <span className="font-medium">{title}:</span>{' '}
                                  {finding.issues.map((item) => item.message).join(' ')}
                                </li>
                              );
                            })}
                            {check.contractFindings.length > 3 && (
                              <li className="text-slate-600">
                                +{check.contractFindings.length - 3} more tool findings.
                              </li>
                            )}
                          </ul>
                        )}
                        {check.invocationFindings && check.invocationFindings.length > 0 && (
                          <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
                            {check.invocationFindings.map((finding, index) => (
                              <li key={`${finding.name}-${index}`}>
                                <span className="font-medium">{finding.name}:</span> {finding.detail}{' '}
                                <span className="text-slate-600">(status: {finding.status}, args: {JSON.stringify(finding.arguments)})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {check.error && <p className="mt-1 text-[11px] text-rose-700">Error: {check.error}</p>}
                      </li>
                    ))}
                  </ul>

                  {probeResult.notes.length > 0 && (
                    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                      <p className="font-semibold">Notes</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {probeResult.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
