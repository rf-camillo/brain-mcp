import path from "node:path";

import { VaultError } from "../core/errors.js";

const WINDOWS_DRIVE = /^[a-zA-Z]:/;

export function toVaultPath(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (trimmed === "" || trimmed.includes("\0")) {
    throw new VaultError("INVALID_PATH", "Path must be a non-empty string");
  }
  if (trimmed.startsWith("/") || WINDOWS_DRIVE.test(trimmed)) {
    throw new VaultError("OUTSIDE_VAULT", `Absolute paths are not allowed: ${input}`);
  }
  const normalized = path.posix.normalize(trimmed).replace(/\/+$/, "");
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new VaultError("OUTSIDE_VAULT", `Path escapes the vault: ${input}`);
  }
  if (normalized === ".") {
    throw new VaultError("INVALID_PATH", "Path must point to a file inside the vault");
  }
  return normalized;
}
