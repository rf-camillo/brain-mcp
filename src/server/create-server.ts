import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

import { PACKAGE_NAME, PACKAGE_VERSION } from "../core/version.js";
import type { AnyTool } from "../tools/define-tool.js";
import { TOOLS } from "../tools/index.js";
import { Vault } from "../vault/vault.js";
import { toFailure, toSuccess } from "./to-result.js";

export interface ServerOptions {
  /** Path to the vault. */
  root: string;
  /** Register only the read tools. Defaults to `false`. */
  readOnly?: boolean;
}

function annotationsFor(tool: AnyTool): ToolAnnotations {
  const base = { title: tool.title, readOnlyHint: tool.access === "read", openWorldHint: false };
  if (tool.access === "read") return base;
  return { ...base, destructiveHint: false, idempotentHint: tool.idempotent ?? false };
}

function register(server: McpServer, vault: Vault, tool: AnyTool): void {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.input,
      outputSchema: tool.output,
      annotations: annotationsFor(tool),
    },
    async (args: Record<string, unknown>) => {
      try {
        await vault.reload();
        return toSuccess(await tool.run(vault, args, { now: new Date() }));
      } catch (error) {
        return toFailure(error);
      }
    },
  );
}

/**
 * Opens the vault and returns an MCP server with its tools registered.
 * Connect it to a transport, for example `StdioServerTransport`.
 */
export async function createServer(options: ServerOptions): Promise<McpServer> {
  const vault = await Vault.open(options.root, { readOnly: options.readOnly ?? false });
  const server = new McpServer({ name: PACKAGE_NAME, version: PACKAGE_VERSION });
  const tools = vault.policy.readOnly ? TOOLS.filter((tool) => tool.access === "read") : TOOLS;
  for (const tool of tools) register(server, vault, tool);
  return server;
}
