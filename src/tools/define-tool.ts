import type { z } from "zod";

import type { Vault } from "../vault/vault.js";

/** Values a tool receives besides its arguments. */
export interface ToolContext {
  /** The current time; injected so diary and lint results are reproducible. */
  now: Date;
}

/** A tool shared by the MCP server and the CLI. */
export interface ToolDefinition<Input extends z.ZodObject, Output extends z.ZodObject> {
  name: string;
  title: string;
  /** Written for the model: when to use the tool and what it returns. */
  description: string;
  access: "read" | "write";
  idempotent?: boolean;
  input: Input;
  output: Output;
  run(
    vault: Vault,
    args: z.output<Input>,
    context: ToolContext,
  ): z.output<Output> | Promise<z.output<Output>>;
}

export type AnyTool = ToolDefinition<z.ZodObject, z.ZodObject>;

/** Declares a tool with type inference for its input and output. */
export function defineTool<Input extends z.ZodObject, Output extends z.ZodObject>(
  tool: ToolDefinition<Input, Output>,
): ToolDefinition<Input, Output> {
  return tool;
}

/** Validates `args` against the tool's input schema and runs it. */
export async function callTool<Input extends z.ZodObject, Output extends z.ZodObject>(
  tool: ToolDefinition<Input, Output>,
  vault: Vault,
  args: z.input<Input>,
  context: Partial<ToolContext> = {},
): Promise<z.output<Output>> {
  return tool.run(vault, tool.input.parse(args), { now: context.now ?? new Date() });
}
