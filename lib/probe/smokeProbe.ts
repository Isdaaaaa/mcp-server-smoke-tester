import type { ServerInput } from '@/lib/schemas/serverInput';
import type {
  ProbeCheckResult,
  SmokeProbeResult,
  ToolContractFinding,
  ToolContractIssue,
  ToolInvocationFinding,
} from '@/lib/probe/types';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

type JsonRpcResponse = {
  jsonrpc?: string;
  id?: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
};

type RequestCheckResult = {
  ok: boolean;
  latencyMs: number;
  statusCode?: number;
  data?: JsonRpcResponse;
  error?: string;
};

const MCP_CLIENT_INFO = {
  name: 'mcp-server-smoke-tester',
  version: '0.1.0',
};

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function buildAuthHeaders(server: ServerInput): HeadersInit {
  if (server.authMode === 'bearer') {
    return { Authorization: `Bearer ${server.bearerToken}` };
  }

  if (server.authMode === 'custom-header') {
    return { [server.customHeaderName]: server.customHeaderValue };
  }

  return {};
}

function ensureResponseShape(value: unknown): JsonRpcResponse {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return value as JsonRpcResponse;
}

function extractToolsArray(data?: JsonRpcResponse): unknown[] | null {
  if (!data || typeof data !== 'object' || typeof data.error === 'object') {
    return null;
  }

  const resultPayload = data.result;
  if (!resultPayload || typeof resultPayload !== 'object' || !("tools" in resultPayload)) {
    return null;
  }

  const tools = (resultPayload as { tools?: unknown }).tools;
  return Array.isArray(tools) ? tools : null;
}

function isJsonSchemaObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateToolContract(tool: unknown, index: number): ToolContractFinding {
  const issues: ToolContractIssue[] = [];

  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
    issues.push({
      code: 'tool-not-object',
      message: `Tool at index ${index} must be an object.`,
    });

    return {
      index,
      name: null,
      issues,
    };
  }

  const record = tool as Record<string, unknown>;
  const rawName = record.name;
  const toolName = typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : null;

  if (!toolName) {
    issues.push({
      code: 'name-missing-or-empty',
      message: `Tool at index ${index} is missing a non-empty string name.`,
    });
  }

  if ('description' in record && typeof record.description !== 'string') {
    issues.push({
      code: 'description-not-string',
      message: `Tool ${toolName ? `"${toolName}"` : `at index ${index}`} has a non-string description.`,
    });
  }

  if (!('inputSchema' in record) || !isJsonSchemaObject(record.inputSchema)) {
    issues.push({
      code: 'input-schema-missing-or-invalid',
      message: `Tool ${toolName ? `"${toolName}"` : `at index ${index}`} must include inputSchema as a JSON object.`,
    });
  } else {
    const typeValue = record.inputSchema.type;
    if (typeof typeValue === 'string' && typeValue !== 'object') {
      issues.push({
        code: 'input-schema-type-not-object',
        message: `Tool ${toolName ? `"${toolName}"` : `at index ${index}`} has inputSchema.type="${typeValue}"; expected "object" for tool input payloads.`,
      });
    }
  }

  return {
    index,
    name: toolName,
    issues,
  };
}

function buildToolContractCheck(result: RequestCheckResult): ProbeCheckResult {
  const base: ProbeCheckResult = {
    id: 'tools-contracts',
    label: 'tool schema contracts',
    pass: false,
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    detail: 'Unable to validate tool contracts.',
  };

  if (result.error) {
    return {
      ...base,
      detail: 'tools/list request failed before contract validation could run.',
      error: result.error,
    };
  }

  const tools = extractToolsArray(result.data);
  if (!tools) {
    return {
      ...base,
      detail: 'tools/list did not include a tools[] array, so contract checks were skipped.',
    };
  }

  const findings = tools.map((tool, index) => validateToolContract(tool, index));
  const findingsWithIssues = findings.filter((finding) => finding.issues.length > 0);

  if (findingsWithIssues.length === 0) {
    return {
      ...base,
      pass: true,
      detail: `Validated ${tools.length} tool contract${tools.length === 1 ? '' : 's'} with no schema issues.`,
      contractFindings: findings,
    };
  }

  return {
    ...base,
    pass: false,
    detail: `${findingsWithIssues.length}/${tools.length} tool contract${tools.length === 1 ? '' : 's'} have schema or metadata issues.`,
    contractFindings: findingsWithIssues,
  };
}

async function requestJsonRpc(
  url: string,
  headers: HeadersInit,
  body: JsonRpcRequest,
): Promise<RequestCheckResult> {
  const start = nowMs();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Math.round(nowMs() - start);
    const text = await response.text();

    if (!text.trim()) {
      return {
        ok: false,
        latencyMs,
        statusCode: response.status,
        error: 'Empty response body.',
      };
    }

    try {
      const data = ensureResponseShape(JSON.parse(text));
      return {
        ok: response.ok,
        latencyMs,
        statusCode: response.status,
        data,
      };
    } catch {
      return {
        ok: false,
        latencyMs,
        statusCode: response.status,
        error: 'Response was not valid JSON.',
      };
    }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(nowMs() - start),
      error: error instanceof Error ? error.message : 'Request failed unexpectedly.',
    };
  }
}

async function checkReachability(url: string, headers: HeadersInit): Promise<ProbeCheckResult> {
  const start = nowMs();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain;q=0.8, */*;q=0.5',
        ...headers,
      },
    });

    const latencyMs = Math.round(nowMs() - start);
    const statusText = response.statusText || 'No status text';

    return {
      id: 'url-reachable',
      label: 'URL reachability',
      pass: true,
      latencyMs,
      statusCode: response.status,
      detail: `Endpoint responded (${response.status} ${statusText}).`,
    };
  } catch (error) {
    return {
      id: 'url-reachable',
      label: 'URL reachability',
      pass: false,
      latencyMs: Math.round(nowMs() - start),
      detail: 'Could not establish HTTP connection to endpoint.',
      error: error instanceof Error ? error.message : 'Unknown network error.',
    };
  }
}

function buildInitializeCheck(result: RequestCheckResult): ProbeCheckResult {
  const base: ProbeCheckResult = {
    id: 'initialize-handshake',
    label: 'Initialize handshake',
    pass: false,
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    detail: 'No valid initialize response returned.',
  };

  if (result.error) {
    return {
      ...base,
      detail: 'Initialize request failed or returned unreadable payload.',
      error: result.error,
    };
  }

  const data = result.data;
  if (!data) {
    return base;
  }

  if (typeof data.error === 'object' && data.error !== null) {
    const code = 'code' in data.error ? data.error.code : 'unknown';
    const message = 'message' in data.error ? String(data.error.message) : 'No error message provided.';

    return {
      ...base,
      pass: true,
      detail: `Server returned JSON-RPC error for initialize (code ${code}): ${message}`,
    };
  }

  if ('result' in data) {
    return {
      ...base,
      pass: true,
      detail: 'Initialize returned a JSON-RPC result payload.',
    };
  }

  return {
    ...base,
    detail: 'Initialize responded but payload was not recognizable JSON-RPC result/error.',
  };
}

function buildToolsListCheck(result: RequestCheckResult): ProbeCheckResult {
  const base: ProbeCheckResult = {
    id: 'tools-list',
    label: 'tools/list capability',
    pass: false,
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    detail: 'tools/list did not return expected tool metadata.',
  };

  if (result.error) {
    return {
      ...base,
      detail: 'tools/list request failed.',
      error: result.error,
    };
  }

  const data = result.data;
  if (!data) {
    return base;
  }

  if (typeof data.error === 'object' && data.error !== null) {
    const message = 'message' in data.error ? String(data.error.message) : 'No error message provided.';
    return {
      ...base,
      detail: 'tools/list responded with JSON-RPC error.',
      error: message,
    };
  }

  const tools = extractToolsArray(data);

  if (tools) {
    return {
      ...base,
      pass: true,
      detail: `tools/list returned ${tools.length} tool${tools.length === 1 ? '' : 's'}.`,
    };
  }

  if ('result' in data) {
    return {
      ...base,
      pass: false,
      detail: 'tools/list returned a result payload, but no tools[] array was found.',
    };
  }

  return base;
}

function firstScalarFromArray(values: unknown[] | undefined): string | number | boolean | null | undefined {
  if (!values) {
    return undefined;
  }

  for (const value of values) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

function deriveRequiredArguments(inputSchema: unknown): Record<string, unknown> {
  if (!isJsonSchemaObject(inputSchema)) {
    return {};
  }

  const required = Array.isArray(inputSchema.required)
    ? inputSchema.required.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    : [];

  if (required.length === 0) {
    return {};
  }

  const properties = isJsonSchemaObject(inputSchema.properties)
    ? (inputSchema.properties as Record<string, unknown>)
    : null;

  if (!properties) {
    return {};
  }

  const derived: Record<string, unknown> = {};

  for (const requiredName of required) {
    const propertySchema = properties[requiredName];
    if (!isJsonSchemaObject(propertySchema)) {
      return {};
    }

    const defaultValue = propertySchema.default;
    if (
      defaultValue === null ||
      typeof defaultValue === 'string' ||
      typeof defaultValue === 'number' ||
      typeof defaultValue === 'boolean'
    ) {
      derived[requiredName] = defaultValue;
      continue;
    }

    if ('const' in propertySchema) {
      const constValue = propertySchema.const;
      if (constValue === null || typeof constValue === 'string' || typeof constValue === 'number' || typeof constValue === 'boolean') {
        derived[requiredName] = constValue;
        continue;
      }
    }

    const enumValue = firstScalarFromArray(Array.isArray(propertySchema.enum) ? propertySchema.enum : undefined);
    if (enumValue !== undefined) {
      derived[requiredName] = enumValue;
      continue;
    }

    return {};
  }

  return derived;
}

type InvocableTool = {
  name: string;
  inputSchema: Record<string, unknown>;
};

function pickInvocationCandidates(tools: unknown[]): InvocableTool[] {
  const candidates: InvocableTool[] = [];

  for (const tool of tools) {
    if (candidates.length >= 2) {
      break;
    }

    if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
      continue;
    }

    const record = tool as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    if (!name || !isJsonSchemaObject(record.inputSchema)) {
      continue;
    }

    candidates.push({
      name,
      inputSchema: record.inputSchema,
    });
  }

  return candidates;
}

async function runToolSampleInvocations(
  url: string,
  headers: HeadersInit,
  toolsListResult: RequestCheckResult,
): Promise<ProbeCheckResult> {
  const base: ProbeCheckResult = {
    id: 'tools-sample-invocations',
    label: 'tools/call sample invocations',
    pass: false,
    latencyMs: null,
    detail: 'No sample tool invocations were attempted.',
  };

  const tools = extractToolsArray(toolsListResult.data);
  if (!tools || tools.length === 0) {
    return {
      ...base,
      detail: 'Skipped sample invocations because tools/list did not return usable tools.',
      error: toolsListResult.error,
    };
  }

  const candidates = pickInvocationCandidates(tools);
  if (candidates.length === 0) {
    return {
      ...base,
      detail: 'No valid invocation candidates found (tools require at least name + inputSchema object).',
    };
  }

  const findings: ToolInvocationFinding[] = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const args = deriveRequiredArguments(candidate.inputSchema);

    const result = await requestJsonRpc(url, headers, {
      jsonrpc: '2.0',
      id: `smoke-tools-call-${index}`,
      method: 'tools/call',
      params: {
        name: candidate.name,
        arguments: args,
      },
    });

    if (result.error) {
      findings.push({
        name: candidate.name,
        pass: false,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        status: 'request-error',
        detail: 'Request failed before JSON-RPC result/error could be parsed.',
        error: result.error,
        arguments: args,
      });
      continue;
    }

    if (!result.data) {
      findings.push({
        name: candidate.name,
        pass: false,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        status: 'invalid-response',
        detail: 'Server responded without a JSON-RPC result/error payload.',
        arguments: args,
      });
      continue;
    }

    if (typeof result.data.error === 'object' && result.data.error !== null) {
      const code = 'code' in result.data.error ? String(result.data.error.code) : 'unknown';
      const message = 'message' in result.data.error ? String(result.data.error.message) : 'No error message provided.';
      findings.push({
        name: candidate.name,
        pass: false,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        status: 'jsonrpc-error',
        detail: `JSON-RPC error ${code}: ${message}`,
        error: message,
        arguments: args,
      });
      continue;
    }

    if ('result' in result.data) {
      findings.push({
        name: candidate.name,
        pass: true,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        status: 'ok',
        detail: 'tools/call returned a JSON-RPC result payload.',
        arguments: args,
      });
      continue;
    }

    findings.push({
      name: candidate.name,
      pass: false,
      latencyMs: result.latencyMs,
      statusCode: result.statusCode,
      status: 'invalid-response',
      detail: 'Server replied, but payload was not a recognizable JSON-RPC result/error.',
      arguments: args,
    });
  }

  const latencyMs = findings.length > 0 ? findings.reduce((sum, item) => sum + item.latencyMs, 0) : null;
  const passCount = findings.filter((finding) => finding.pass).length;

  return {
    ...base,
    pass: passCount === findings.length,
    latencyMs,
    detail: `Sampled ${findings.length} tool invocation${findings.length === 1 ? '' : 's'} (${passCount} passed, ${findings.length - passCount} failed).`,
    invocationFindings: findings,
  };
}

export async function runSmokeProbe(server: ServerInput): Promise<SmokeProbeResult> {
  const headers = buildAuthHeaders(server);
  const startedAt = new Date().toISOString();
  const runStart = nowMs();

  const checks: ProbeCheckResult[] = [];

  const reachability = await checkReachability(server.serverUrl, headers);
  checks.push(reachability);

  const initializeResponse = await requestJsonRpc(server.serverUrl, headers, {
    jsonrpc: '2.0',
    id: 'smoke-initialize',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: MCP_CLIENT_INFO,
      capabilities: {},
    },
  });
  const initializeCheck = buildInitializeCheck(initializeResponse);
  checks.push(initializeCheck);

  const toolsListResponse = await requestJsonRpc(server.serverUrl, headers, {
    jsonrpc: '2.0',
    id: 'smoke-tools-list',
    method: 'tools/list',
    params: {},
  });
  const toolsCheck = buildToolsListCheck(toolsListResponse);
  checks.push(toolsCheck);

  const contractsCheck = buildToolContractCheck(toolsListResponse);
  checks.push(contractsCheck);

  const invocationsCheck = await runToolSampleInvocations(server.serverUrl, headers, toolsListResponse);
  checks.push(invocationsCheck);

  const passCount = checks.filter((check) => check.pass).length;
  const notes: string[] = [];

  if (!initializeCheck.pass && toolsCheck.pass) {
    notes.push('Initialize did not validate, but tools/list worked. Endpoint may require a different handshake format.');
  }

  if (reachability.pass && !toolsCheck.pass) {
    notes.push('Endpoint is reachable, but MCP method support appears partial or protected.');
  }

  if (!contractsCheck.pass && contractsCheck.contractFindings && contractsCheck.contractFindings.length > 0) {
    const sampleFinding = contractsCheck.contractFindings[0];
    const sampleIssue = sampleFinding.issues[0];
    if (sampleIssue) {
      notes.push(`Contract warning: ${sampleIssue.message}`);
    }
  }

  if (invocationsCheck.invocationFindings && invocationsCheck.invocationFindings.length > 0) {
    const failedInvocation = invocationsCheck.invocationFindings.find((item) => !item.pass);
    if (failedInvocation) {
      notes.push(
        `Invocation note: Tool "${failedInvocation.name}" failed (${failedInvocation.status}). Verify required arguments/auth expectations, then rerun with concrete payloads from server docs.`,
      );
    }
  } else if (!invocationsCheck.pass) {
    notes.push('Invocation note: No valid tools were available for sample tools/call checks.');
  }

  return {
    endpoint: server.serverUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalLatencyMs: Math.round(nowMs() - runStart),
    checks,
    summary: {
      passCount,
      totalCount: checks.length,
    },
    notes,
  };
}
