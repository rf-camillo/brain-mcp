import { VaultError } from "../core/errors.js";

export function integerFlag(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed))
    throw new VaultError("INVALID_INPUT", `--${flag} must be an integer`);
  return parsed;
}

export function required(value: string | undefined, what: string): string {
  if (value === undefined || value.trim() === "")
    throw new VaultError("INVALID_INPUT", `Missing ${what}`);
  return value;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function jsonObjectFlag(value: string | undefined, flag: string): Record<string, unknown> {
  const parsed = parseJson(required(value, `--${flag}`));
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new VaultError("INVALID_INPUT", `--${flag} must be a JSON object`);
}

export function omitUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
