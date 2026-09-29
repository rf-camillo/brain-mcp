import { ZodError } from "zod";

import { errorMessage, VaultError } from "../core/errors.js";
import { Vault } from "../vault/vault.js";
import { COMMANDS } from "./commands.js";
import { parseCli, type ParsedCli, USAGE } from "./options.js";

export interface CliResult {
  code: number;
  output: string;
}

const json = (value: unknown): string => JSON.stringify(value, null, 2);

function describeError(error: unknown): { error: string; message: string } {
  if (error instanceof VaultError) return { error: error.code, message: error.message };
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
      .join("; ");
    return { error: "INVALID_INPUT", message };
  }
  return { error: "INTERNAL", message: errorMessage(error) };
}

export async function runCli(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<CliResult> {
  let parsed: ParsedCli;
  try {
    parsed = parseCli(argv);
  } catch (error) {
    return { code: 2, output: `${errorMessage(error)}\n\n${USAGE}` };
  }
  const { values, command, rest } = parsed;
  if (values.help === true) return { code: 0, output: USAGE };
  if (command === undefined) return { code: 2, output: USAGE };

  try {
    const definition = COMMANDS[command];
    if (definition === undefined) {
      throw new VaultError("INVALID_INPUT", `Unknown command "${command}". Run brain --help.`);
    }
    const vault = await Vault.open(values.vault ?? env.BRAIN_VAULT ?? process.cwd(), {
      readOnly: values["read-only"] === true,
    });
    const { tool } = definition;
    const result = await tool.run(vault, tool.input.parse(definition.args(rest, values)), {
      now: new Date(),
    });
    return { code: definition.failed?.(result) ? 1 : 0, output: json(result) };
  } catch (error) {
    return { code: 1, output: json(describeError(error)) };
  }
}
