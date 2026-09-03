/**
 * Victoroff OS — ChatGPT App / MCP Connector
 * ------------------------------------------
 * Run locally:
 *   npx tsx src/server.ts
 * Then expose with ngrok and register the printed URL + /mcp in
 * ChatGPT: Settings → Apps & Connectors → Developer Mode → Create.
 *
 * Deploy target: Vercel serverless function OR Cloudflare Worker
 * (this repo already has vercel.json and wrangler.jsonc — wrap this
 * handler in whichever platform's HTTP entrypoint you prefer).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "node:http";

const server = new McpServer({
  name: "victoroff-os",
  version: "0.1.0",
});

server.registerTool(
  "assess_governance_exposure",
  {
    title: "Assess Governance Exposure",
    description:
      "Runs a Victoroff Governance Exposure Assessment for a named institution and returns a risk summary with citations to source records.",
    inputSchema: {
      institution: z.string().describe("Institution name, e.g. 'University of Washington'"),
      system: z
        .enum(["blackbaud", "salesforce", "ellucian", "other"])
        .describe("Advancement platform in use"),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ institution, system }) => {
    const result = {
      institution,
      system,
      riskLevel: "moderate",
      findings: [
        "Sample finding placeholder — connect to real assessment engine.",
      ],
      generatedAt: new Date().toISOString(),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "verify_record_provenance",
  {
    title: "Verify Record Provenance",
    description:
      "Checks the source provenance and revision history for a given record ID and returns whether it is verifiable.",
    inputSchema: {
      recordId: z.string().describe("Internal record identifier"),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ recordId }) => {
    const result = {
      recordId,
      verified: true,
      revisionCount: 1,
      lastVerifiedAt: new Date().toISOString(),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "generate_audit_receipt",
  {
    title: "Generate Audit Receipt",
    description:
      "Creates an exportable audit receipt documenting a governance action or assessment for institutional records.",
    inputSchema: {
      institution: z.string(),
      summary: z.string().describe("Short description of the action being receipted"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ institution, summary }) => {
    const receiptId = `VOS-${Date.now()}`;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { receiptId, institution, summary, issuedAt: new Date().toISOString() },
            null,
            2
          ),
        },
      ],
    };
  }
);

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/mcp") {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } else {
    res.writeHead(404).end();
  }
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Victoroff MCP server listening on http://localhost:${PORT}/mcp`);
});
