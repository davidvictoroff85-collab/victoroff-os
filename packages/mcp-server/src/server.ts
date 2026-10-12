/**
 * Victoroff OS — MCP connector (Streamable HTTP, stateless).
 * -----------------------------------------------------------
 * A dependency-free Model Context Protocol endpoint built on the Fetch API,
 * so it runs unchanged in Cloudflare Workers, Node 24, and tests.
 *
 * Supported: initialize, notifications/*, ping, tools/list, tools/call.
 * Responses are plain JSON (no SSE stream); GET and DELETE return 405,
 * which the Streamable HTTP transport permits for stateless servers.
 *
 * Local dev:   pnpm exec wrangler dev   → http://localhost:8787/mcp
 * Production:  https://victoroffgroup.com/mcp
 */

import { TOOLS, ToolInputError, callTool } from "./tools.js";

export const SERVER_INFO = { name: "victoroff-os", title: "Victoroff", version: "0.2.0" };
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS =
  "Victoroff reconstructs AI and human authority behind consequential actions for banks, fintechs, and payment " +
  "operations. Use list_victoroff_offers for services and prices, scope_reconstruction_snapshot to draft a Snapshot " +
  "scope from a workflow and outcome, and check_action_provenance to check whether the record for an action is " +
  "complete. Never present a draft scope as a contract, and never treat a supplied record as independently verified.";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id, authorization",
  "access-control-expose-headers": "mcp-protocol-version",
};

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type RpcId = string | number | null;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

function rpcError(id: RpcId, code: number, message: string, status = 200): Response {
  return json({ jsonrpc: "2.0", id, error: { code, message } }, status);
}

function negotiateVersion(requested: unknown): string {
  return typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : (SUPPORTED_PROTOCOL_VERSIONS[0] as string);
}

function dispatch(message: JsonRpcRequest): Response {
  const id: RpcId = message.id ?? null;
  const params = message.params ?? {};

  // Notifications carry no id and receive no JSON-RPC response.
  if (message.id === undefined) {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  switch (message.method) {
    case "initialize":
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: negotiateVersion(params.protocolVersion),
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      });
    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });
    case "tools/list":
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
            name,
            title,
            description,
            inputSchema,
            annotations,
          })),
        },
      });
    case "tools/call": {
      const name = params.name;
      const args = params.arguments ?? {};
      if (typeof name !== "string") return rpcError(id, -32602, "params.name must be a string");
      if (typeof args !== "object" || args === null || Array.isArray(args)) {
        return rpcError(id, -32602, "params.arguments must be an object");
      }
      try {
        return json({ jsonrpc: "2.0", id, result: callTool(name, args as Record<string, unknown>) });
      } catch (error) {
        if (error instanceof ToolInputError) return rpcError(id, -32602, error.message);
        return rpcError(id, -32603, "Internal error");
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${message.method}`);
  }
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST, OPTIONS", ...CORS_HEADERS },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    (body as JsonRpcRequest).jsonrpc !== "2.0" ||
    typeof (body as JsonRpcRequest).method !== "string"
  ) {
    // Responses sent by a client (no method) are acknowledged without a body.
    if (typeof body === "object" && body !== null && !Array.isArray(body) && "result" in body) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }
    return rpcError(null, -32600, "Invalid Request", 400);
  }

  return dispatch(body as JsonRpcRequest);
}
