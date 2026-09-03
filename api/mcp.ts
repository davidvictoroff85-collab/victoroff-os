/**
 * Vercel serverless function — production endpoint for the Victoroff
 * MCP connector. Deploys automatically alongside apps/site since
 * Vercel auto-detects any /api/*.ts file as a Node serverless function.
 *
 * Production URL will be:
 *   https://<your-vercel-domain>/api/mcp
 * Register that URL in ChatGPT: Settings → Apps & Connectors →
 * Developer Mode → Create, using /api/mcp as the MCP endpoint path.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createVictoroffMcpServer } from "../packages/mcp-server/src/server.js";

export const config = { runtime: "nodejs" };

let transport: StreamableHTTPServerTransport | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createVictoroffMcpServer();
    await server.connect(transport);
  }
  await transport.handleRequest(req, res);
}
