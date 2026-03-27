import type { ServerInput } from '@/lib/schemas/serverInput';

export type ProbeCheckId = 'url-reachable' | 'initialize-handshake' | 'tools-list';

export interface ProbeCheckResult {
  id: ProbeCheckId;
  label: string;
  pass: boolean;
  latencyMs: number | null;
  detail: string;
  statusCode?: number;
  error?: string;
}

export interface SmokeProbeSummary {
  passCount: number;
  totalCount: number;
}

export interface SmokeProbeResult {
  endpoint: string;
  startedAt: string;
  finishedAt: string;
  totalLatencyMs: number;
  checks: ProbeCheckResult[];
  summary: SmokeProbeSummary;
  notes: string[];
}

export interface SmokeProbeInput {
  server: ServerInput;
}
