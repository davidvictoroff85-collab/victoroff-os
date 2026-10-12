/**
 * Cloudflare Worker entry for the Victoroff MCP connector (victoroff-mcp).
 * Deployed separately from the static site so the site keeps its
 * static-asset-only boundary.
 *
 *   https://mcp.victoroffgroup.com/mcp   MCP endpoint (Streamable HTTP)
 *   https://mcp.victoroffgroup.com/      Plain-text pointer to the endpoint
 */

import { SERVER_INFO, handleMcpRequest } from "./server.js";

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/mcp" || pathname === "/mcp/") return handleMcpRequest(request);
    if (pathname === "/") {
      return new Response(
        `${SERVER_INFO.title} MCP connector v${SERVER_INFO.version}. Endpoint: /mcp (POST, Streamable HTTP).\n`,
        { headers: { "content-type": "text/plain; charset=utf-8", ...SECURITY_HEADERS } },
      );
    }
    return new Response("Not Found\n", { status: 404, headers: SECURITY_HEADERS });
  },
};
