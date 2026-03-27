import type { SmokeProbeResult } from '@/lib/probe/types';
import type { ServerInput } from '@/lib/schemas/serverInput';

function toIsoOrFallback(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function authSummary(server: ServerInput): string {
  if (server.authMode === 'none') {
    return 'none';
  }

  if (server.authMode === 'bearer') {
    return 'bearer (token redacted)';
  }

  const headerName = server.customHeaderName.trim() || 'custom-header';
  return `custom-header (${headerName}: [redacted])`;
}

function escapeInline(value: string): string {
  return value.replace(/`/g, '\\`');
}

function stringifyArgs(args: Record<string, unknown>): string {
  const rendered = JSON.stringify(args, null, 2);
  return rendered ?? '{}';
}

export function buildMarkdownReport(server: ServerInput, report: SmokeProbeResult): string {
  const lines: string[] = [];

  lines.push('# MCP Smoke Test Report');
  lines.push('');
  lines.push(`Generated: ${toIsoOrFallback(report.finishedAt)}`);
  lines.push(`Endpoint: ${escapeInline(report.endpoint)}`);
  lines.push(`Auth mode: ${authSummary(server)}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Score: **${report.summary.passCount}/${report.summary.totalCount}** checks passed`);
  lines.push(`- Total latency: **${report.totalLatencyMs}ms**`);
  lines.push(`- Started at: ${toIsoOrFallback(report.startedAt)}`);
  lines.push(`- Finished at: ${toIsoOrFallback(report.finishedAt)}`);
  lines.push('');
  lines.push('## Checks');
  lines.push('');

  for (const check of report.checks) {
    const mark = check.pass ? '✅' : '❌';
    lines.push(`### ${mark} ${check.label}`);
    lines.push('');
    lines.push(`- ID: \`${check.id}\``);
    lines.push(`- Status: **${check.pass ? 'PASS' : 'FAIL'}**`);
    lines.push(`- Detail: ${check.detail}`);
    lines.push(`- Latency: ${check.latencyMs ?? 'n/a'}ms`);
    if (typeof check.statusCode === 'number') {
      lines.push(`- HTTP status: ${check.statusCode}`);
    }
    if (check.error) {
      lines.push(`- Error: ${check.error}`);
    }

    if (check.contractFindings && check.contractFindings.length > 0) {
      lines.push('');
      lines.push('#### Contract findings');
      lines.push('');
      for (const finding of check.contractFindings) {
        const label = finding.name ? `\`${finding.name}\`` : `index ${finding.index}`;
        if (finding.issues.length === 0) {
          lines.push(`- ${label}: no issues`);
          continue;
        }
        lines.push(`- ${label}:`);
        for (const issue of finding.issues) {
          lines.push(`  - [${issue.code}] ${issue.message}`);
        }
      }
    }

    if (check.invocationFindings && check.invocationFindings.length > 0) {
      lines.push('');
      lines.push('#### Invocation findings');
      lines.push('');
      for (const finding of check.invocationFindings) {
        lines.push(`- \`${finding.name}\` — ${finding.pass ? 'PASS' : 'FAIL'} (${finding.status}, ${finding.latencyMs}ms)`);
        lines.push(`  - Detail: ${finding.detail}`);
        if (typeof finding.statusCode === 'number') {
          lines.push(`  - HTTP status: ${finding.statusCode}`);
        }
        if (finding.error) {
          lines.push(`  - Error: ${finding.error}`);
        }
        lines.push('  - Arguments:');
        lines.push('```json');
        lines.push(stringifyArgs(finding.arguments));
        lines.push('```');
      }
    }

    lines.push('');
  }

  lines.push('## Notes');
  lines.push('');
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
