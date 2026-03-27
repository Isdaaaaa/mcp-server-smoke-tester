import type { ServerInput } from '@/lib/schemas/serverInput';
import type { ProbeCheckResult, SmokeProbeResult } from '@/lib/probe/types';

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

  const resultPayload = data.result;
  const tools =
    resultPayload &&
    typeof resultPayload === 'object' &&
    'tools' in resultPayload &&
    Array.isArray((resultPayload as { tools?: unknown }).tools)
      ? ((resultPayload as { tools: unknown[] }).tools ?? [])
      : null;

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

  const passCount = checks.filter((check) => check.pass).length;
  const notes: string[] = [];

  if (!initializeCheck.pass && toolsCheck.pass) {
    notes.push('Initialize did not validate, but tools/list worked. Endpoint may require a different handshake format.');
  }

  if (reachability.pass && !toolsCheck.pass) {
    notes.push('Endpoint is reachable, but MCP method support appears partial or protected.');
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
