import { realpath } from "node:fs/promises";
import path from "node:path";

import { VaultError } from "../core/errors.js";
import { hasErrorCode } from "../core/fs.js";

export function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  if (relative === "") return true;
  return relative.split(path.sep)[0] !== ".." && !path.isAbsolute(relative);
}

async function realpathOfNearestExisting(target: string): Promise<string> {
  const missing: string[] = [];
  for (let current = target; ; current = path.dirname(current)) {
    try {
      return path.join(await realpath(current), ...missing.reverse());
    } catch (error) {
      if (!hasErrorCode(error, "ENOENT")) throw error;
      if (path.dirname(current) === current) return target;
      missing.push(path.basename(current));
    }
  }
}

export async function resolveInside(root: string, vaultPath: string): Promise<string> {
  const absolute = path.join(root, ...vaultPath.split("/"));
  if (!isInside(root, await realpathOfNearestExisting(absolute))) {
    throw new VaultError("OUTSIDE_VAULT", `Path resolves outside the vault: ${vaultPath}`);
  }
  return absolute;
}
