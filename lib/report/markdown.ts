import type { SmokeProbeResult } from '@/lib/probe/types';
import type { ServerInput } from '@/lib/schemas/serverInput';

function authSummary(server: ServerInput): string {
  if (server.authMode === 'none') {
    return 'none';
  }

  if (server.authMode === 'bearer') {
    return 'bearer (token: [REDACTED])';
  }

  const headerName = server.customHeaderName.trim() || 'custom-header';
  return `custom-header (${headerName}: [REDACTED])`;
}

function escapeInline(value: string): string {
  return value.replace(/`/g, '\\`');
}

function renderStatusCode(statusCode?: number): string {
  return typeof statusCode === 'number' ? String(statusCode) : 'n/a';
}

export function buildMarkdownReport(server: ServerInput, report: SmokeProbeResult): string {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];

  lines.push('# MCP Smoke Test Report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push('');
  lines.push('## Endpoint');
  lines.push(`- URL: ${escapeInline(report.endpoint)}`);
  lines.push(`- Auth mode: ${authSummary(server)}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Score: ${report.summary.passCount}/${report.summary.totalCount}`);
  lines.push(`- Total latency: ${report.totalLatencyMs}ms`);
  lines.push(`- Started at: ${report.startedAt}`);
  lines.push(`- Finished at: ${report.finishedAt}`);
  lines.push('');
  lines.push('## Per-check Status');
  lines.push('');

  for (const check of report.checks) {
    lines.push(`- **${check.label}** (${check.id}) — ${check.pass ? 'PASS' : 'FAIL'}`);
    lines.push(`  - Detail: ${check.detail}`);
    lines.push(`  - Latency: ${check.latencyMs ?? 'n/a'}ms`);
    lines.push(`  - HTTP status: ${renderStatusCode(check.statusCode)}`);
    if (check.error) {
      lines.push(`  - Error: ${check.error}`);
    }
  }

  lines.push('');
  lines.push('## Contract Findings');

  const contractFindings = report.checks.flatMap((check) => check.contractFindings ?? []);
  if (contractFindings.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of contractFindings) {
      const toolLabel = finding.name ? `\`${escapeInline(finding.name)}\`` : `index ${finding.index}`;
      if (finding.issues.length === 0) {
        lines.push(`- ${toolLabel}: no issues`);
        continue;
      }

      lines.push(`- ${toolLabel}:`);
      for (const issue of finding.issues) {
        lines.push(`  - [${issue.code}] ${issue.message}`);
      }
    }
  }

  lines.push('');
  lines.push('## Invocation Findings');

  const invocationFindings = report.checks.flatMap((check) => check.invocationFindings ?? []);
  if (invocationFindings.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of invocationFindings) {
      lines.push(`- \`${escapeInline(finding.name)}\` — ${finding.pass ? 'PASS' : 'FAIL'} (${finding.status})`);
      lines.push(`  - Detail: ${finding.detail}`);
      lines.push(`  - Latency: ${finding.latencyMs}ms`);
      lines.push(`  - HTTP status: ${renderStatusCode(finding.statusCode)}`);
      lines.push(`  - Arguments: \`${JSON.stringify(finding.arguments)}\``);
      if (finding.error) {
        lines.push(`  - Error: ${finding.error}`);
      }
    }
  }

  lines.push('');
  lines.push('## Notes');

  if (report.notes.length === 0) {
    lines.push('- None');
  } else {
    for (const note of report.notes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push('');

  return lines.join('\n');
}
