import { readdir } from "node:fs/promises";
import path from "node:path";

import type { AccessPolicy } from "../guards/access-policy.js";

export async function walkVault(root: string, policy: AccessPolicy, dir = ""): Promise<string[]> {
  const absolute = dir === "" ? root : path.join(root, ...dir.split("/"));
  const entries = await readdir(absolute, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const child = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!policy.isHiddenDirectory(child)) files.push(...(await walkVault(root, policy, child)));
    } else if (entry.isFile() && !policy.isHidden(child)) {
      files.push(child);
    }
  }
  return files;
}
