import type { ServerInput } from '@/lib/schemas/serverInput';

export type ProbeCheckId = 'url-reachable' | 'initialize-handshake' | 'tools-list' | 'tools-contracts';

export type ToolContractIssueCode =
  | 'tool-not-object'
  | 'name-missing-or-empty'
  | 'description-not-string'
  | 'input-schema-missing-or-invalid'
  | 'input-schema-type-not-object';

export interface ToolContractIssue {
  code: ToolContractIssueCode;
  message: string;
}

export interface ToolContractFinding {
  index: number;
  name: string | null;
  issues: ToolContractIssue[];
}

export interface ProbeCheckResult {
  id: ProbeCheckId;
  label: string;
  pass: boolean;
  latencyMs: number | null;
  detail: string;
  statusCode?: number;
  error?: string;
  contractFindings?: ToolContractFinding[];
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
