import { describe, expect, it } from "vitest";
import { handleMcpRequest } from "./server.js";
import worker from "./worker.js";

async function rpc(method: string, params?: Record<string, unknown>, id: number | null = 1) {
  const body: Record<string, unknown> = { jsonrpc: "2.0", method };
  if (id !== null) body.id = id;
  if (params) body.params = params;
  const response = await handleMcpRequest(
    new Request("https://victoroffgroup.com/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify(body),
    }),
  );
  return response;
}

async function call(name: string, args: Record<string, unknown>) {
  const response = await rpc("tools/call", { name, arguments: args });
  const payload = (await response.json()) as { result: { structuredContent: Record<string, unknown>; isError?: boolean } };
  return payload.result;
}

describe("MCP protocol", () => {
  it("initializes and negotiates a supported protocol version", async () => {
    const response = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    const payload = (await response.json()) as { result: { protocolVersion: string; serverInfo: { name: string } } };
    expect(payload.result.protocolVersion).toBe("2025-06-18");
    expect(payload.result.serverInfo.name).toBe("victoroff-os");
  });

  it("acknowledges notifications with 202 and no body", async () => {
    const response = await rpc("notifications/initialized", undefined, null);
    expect(response.status).toBe(202);
  });

  it("lists three read-only tools", async () => {
    const response = await rpc("tools/list");
    const payload = (await response.json()) as { result: { tools: { name: string; annotations: { readOnlyHint: boolean } }[] } };
    expect(payload.result.tools.map((tool) => tool.name)).toEqual([
      "list_victoroff_offers",
      "scope_reconstruction_snapshot",
      "check_action_provenance",
    ]);
    expect(payload.result.tools.every((tool) => tool.annotations.readOnlyHint)).toBe(true);
  });

  it("rejects GET with 405", async () => {
    const response = await handleMcpRequest(new Request("https://victoroffgroup.com/mcp"));
    expect(response.status).toBe(405);
  });

  it("returns method-not-found for unknown methods", async () => {
    const payload = (await (await rpc("resources/list")).json()) as { error: { code: number } };
    expect(payload.error.code).toBe(-32601);
  });
});

describe("tools", () => {
  it("lists the offers published on victoroffgroup.com", async () => {
    const result = await call("list_victoroff_offers", {});
    const offers = result.structuredContent.offers as { priceUsd: number | null; startUrl: string }[];
    expect(offers.map((offer) => offer.priceUsd)).toEqual([2500, 12500, null]);
    expect(offers.every((offer) => offer.startUrl.startsWith("https://victoroffgroup.com/"))).toBe(true);
  });

  it("scopes a Snapshot and lists open questions for missing details", async () => {
    const result = await call("scope_reconstruction_snapshot", {
      workflow_name: "Supplier payment hold",
      outcome: "A $48,500 supplier payment was held after bank details changed.",
    });
    expect(result.structuredContent.price).toBe("$2,500 fixed fee");
    expect(result.structuredContent.readyForStatementOfWork).toBe(false);
    expect((result.structuredContent.openQuestions as string[]).length).toBe(4);
  });

  it("marks a fully described Snapshot ready for a statement of work", async () => {
    const result = await call("scope_reconstruction_snapshot", {
      workflow_name: "Supplier payment hold",
      outcome: "Payment held after bank details changed.",
      systems: ["NetSuite", "Email"],
      policies: ["Payments release policy"],
      workflow_owner: "Finance Controller",
      evidence_handling: "Redacted exports only",
    });
    expect(result.structuredContent.readyForStatementOfWork).toBe(true);
  });

  it("returns insufficient_provenance when elements are missing", async () => {
    const result = await call("check_action_provenance", { action: "Released payment hold", approved_by: "Ops lead" });
    expect(result.structuredContent.verdict).toBe("insufficient_provenance");
    expect((result.structuredContent.gaps as string[]).length).toBe(5);
  });

  it("returns documented only when every element is supplied", async () => {
    const result = await call("check_action_provenance", {
      action: "Released payment hold",
      requested_by: "Customer success",
      authority_source: "Payments policy section 4.2",
      authorized_scope: "Holds under $25,000",
      approved_by: "Ops lead",
      approved_at: "2026-10-01T14:00:00Z",
      evidence: ["TICKET-1042"],
    });
    expect(result.structuredContent.verdict).toBe("documented");
  });

  it("flags an unreadable approval date", async () => {
    const result = await call("check_action_provenance", {
      action: "Released payment hold",
      requested_by: "a",
      authority_source: "b",
      authorized_scope: "c",
      approved_by: "d",
      approved_at: "last Tuesday",
      evidence: ["e"],
    });
    expect(result.structuredContent.verdict).toBe("insufficient_provenance");
  });

  it("reports invalid input as a tool error", async () => {
    const result = await call("scope_reconstruction_snapshot", { workflow_name: "x" });
    expect(result.isError).toBe(true);
  });
});

describe("worker routing", () => {
  it("serves the endpoint at /mcp and 404s elsewhere", async () => {
    const root = await worker.fetch(new Request("https://mcp.victoroffgroup.com/"));
    expect(await root.text()).toContain("/mcp");
    const mcp = await worker.fetch(new Request("https://mcp.victoroffgroup.com/mcp"));
    expect(mcp.status).toBe(405);
    const other = await worker.fetch(new Request("https://mcp.victoroffgroup.com/admin"));
    expect(other.status).toBe(404);
  });
});
