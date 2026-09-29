import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { errorMessage, VaultError } from "../core/errors.js";

function asText(value: unknown): CallToolResult["content"] {
  return [{ type: "text", text: JSON.stringify(value, null, 2) }];
}

export function toSuccess(result: Record<string, unknown>): CallToolResult {
  return { content: asText(result), structuredContent: result };
}

export function toFailure(error: unknown): CallToolResult {
  const payload =
    error instanceof VaultError
      ? { error: error.code, message: error.message }
      : { error: "INTERNAL", message: errorMessage(error) };
  return { isError: true, content: asText(payload) };
}
