import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { PACKAGE_NAME, PACKAGE_VERSION } from "../../src/core/version.js";
import { createServer } from "../../src/server/create-server.js";
import { teamVault } from "../support/fixtures.js";

async function connect(root: string, readOnly = false): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = await createServer({ root, readOnly });
  const client = new Client({ name: "test", version: "0.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

function parse(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const [first] = result.content as { type: string; text: string }[];
  return JSON.parse(first?.text ?? "null");
}

describe("MCP server", () => {
  it("completes the handshake", async () => {
    const client = await connect(await teamVault());
    expect(client.getServerVersion()).toMatchObject({
      name: PACKAGE_NAME,
      version: PACKAGE_VERSION,
    });
    await client.close();
  });

  it("lists read and write tools with the right hints", async () => {
    const client = await connect(await teamVault());
    const { tools } = await client.listTools();
    expect(tools.map((tool) => [tool.name, tool.annotations?.readOnlyHint])).toEqual([
      ["vault_index", true],
      ["note_search", true],
      ["note_read", true],
      ["note_links", true],
      ["vault_lint", true],
      ["diary_add", false],
      ["note_create", false],
      ["index_build", false],
    ]);
    await client.close();
  });

  it("hides write tools in read-only mode", async () => {
    const client = await connect(await teamVault(), true);
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      "vault_index",
      "note_search",
      "note_read",
      "note_links",
      "vault_lint",
    ]);
    await client.close();
  });

  it("returns tool results as JSON text", async () => {
    const client = await connect(await teamVault());
    const result = await client.callTool({ name: "note_read", arguments: { ref: "Ana" } });
    expect(result.isError).toBeFalsy();
    expect(parse(result)).toMatchObject({ path: "people/Ana.md", title: "Ana" });
    await client.close();
  });

  it("declares output schemas and returns structured content", async () => {
    const client = await connect(await teamVault());
    const { tools } = await client.listTools();
    expect(tools.every((tool) => tool.outputSchema?.type === "object")).toBe(true);
    const result = await client.callTool({ name: "vault_index", arguments: { type: "person" } });
    expect(result.structuredContent).toEqual({
      total: 1,
      offset: 0,
      notes: [
        {
          path: "people/Ana.md",
          title: "Ana",
          type: "person",
          summary: "Product lead, owns the launch",
        },
      ],
    });
    await client.close();
  });

  it("turns vault errors into tool errors", async () => {
    const client = await connect(await teamVault());
    const result = await client.callTool({
      name: "note_read",
      arguments: { ref: "private/Salaries.md" },
    });
    expect(result.isError).toBe(true);
    expect(parse(result)).toMatchObject({ error: "NOT_FOUND" });
    await client.close();
  });

  it("rejects invalid arguments", async () => {
    const client = await connect(await teamVault());
    const result = await client.callTool({ name: "note_search", arguments: { query: "" } });
    expect(result.isError).toBe(true);
    await client.close();
  });

  it("sees notes created after startup", async () => {
    const root = await teamVault();
    const client = await connect(root);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(`${root}/Later.md`, "---\ntype: idea\nsummary: Added later\n---\n# Later\n");
    const result = await client.callTool({ name: "note_read", arguments: { ref: "Later" } });
    expect(parse(result)).toMatchObject({ path: "Later.md" });
    await client.close();
  });
});
