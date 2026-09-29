#!/usr/bin/env node
import { parseArgs } from "node:util";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { errorMessage } from "../core/errors.js";
import { PACKAGE_VERSION } from "../core/version.js";
import { createServer } from "../server/create-server.js";

const USAGE = `Usage: brain-mcp <vault-path> [--read-only]

Starts the MCP server over stdio. The vault path can also come from $BRAIN_VAULT.`;

const OPTIONS = {
  "read-only": { type: "boolean" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

function exit(message: string, code: number): never {
  (code === 0 ? process.stdout : process.stderr).write(`${message}\n`);
  process.exit(code);
}

function parse(): ReturnType<
  typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>
> {
  try {
    return parseArgs({ options: OPTIONS, allowPositionals: true });
  } catch (error) {
    return exit(`${errorMessage(error)}\n\n${USAGE}`, 2);
  }
}

const { values, positionals } = parse();
if (values.help === true) exit(USAGE, 0);
if (values.version === true) exit(PACKAGE_VERSION, 0);

const root = positionals[0] ?? process.env.BRAIN_VAULT;
if (root === undefined) exit(USAGE, 2);

try {
  const server = await createServer({ root, readOnly: values["read-only"] === true });
  await server.connect(new StdioServerTransport());
} catch (error) {
  exit(`brain-mcp: ${errorMessage(error)}`, 1);
}
