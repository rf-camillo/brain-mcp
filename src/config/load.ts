import path from "node:path";

import { parse } from "yaml";

import { errorMessage, VaultError } from "../core/errors.js";
import { readIfExists } from "../core/fs.js";
import { configSchema, type VaultConfig } from "./schema.js";

export const CONFIG_FILE = "brain.config.yaml";

function invalid(detail: string): VaultError {
  return new VaultError("INVALID_CONFIG", `Invalid ${CONFIG_FILE}: ${detail}`);
}

function assertValidPatterns(config: VaultConfig): void {
  for (const { name, pattern, flags } of config.sensitive.patterns) {
    try {
      new RegExp(pattern, flags);
    } catch (error) {
      throw invalid(
        `sensitive pattern "${name}" is not a valid regular expression (${errorMessage(error)})`,
      );
    }
  }
}

/** Validates raw configuration, applying defaults. Throws `VaultError` with `INVALID_CONFIG`. */
export function parseConfig(input: unknown): VaultConfig {
  const result = configSchema.safeParse(input ?? {});
  if (!result.success) {
    throw invalid(
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; "),
    );
  }
  assertValidPatterns(result.data);
  return result.data;
}

export async function loadConfig(root: string): Promise<VaultConfig> {
  const text = await readIfExists(path.join(root, CONFIG_FILE));
  if (text === null) return parseConfig({});
  let data: unknown;
  try {
    data = parse(text);
  } catch (error) {
    throw invalid(errorMessage(error));
  }
  return parseConfig(data);
}
