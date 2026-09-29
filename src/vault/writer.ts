import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { VaultError } from "../core/errors.js";
import { hasErrorCode, readIfExists } from "../core/fs.js";
import type { AccessPolicy } from "../guards/access-policy.js";
import { resolveInside } from "../guards/containment.js";
import type { SensitiveScanner } from "../guards/sensitive/scanner.js";
import { toVaultPath } from "../guards/vault-path.js";
import { KeyedLock } from "./lock.js";

export interface WriteTarget {
  vaultPath: string;
  absolute: string;
}

export interface UpdateResult {
  created: boolean;
  changed: boolean;
}

export type Update = (existing: string | null) => string | null | Promise<string | null>;

const fileLocks = new KeyedLock();

async function replaceAtomically(absolute: string, text: string): Promise<void> {
  const temporary = `${absolute}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, absolute);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export class VaultWriter {
  constructor(
    private readonly root: string,
    private readonly policy: AccessPolicy,
    private readonly scanner: SensitiveScanner,
  ) {}

  assertSafe(text: string, where: string): void {
    const found = this.scanner.scan(text);
    if (found.length === 0) return;
    const detail = found.map(({ name, line }) => `${name} (line ${String(line)})`).join(", ");
    throw new VaultError(
      "SENSITIVE_CONTENT",
      `Refusing to write ${where}: it looks like it contains ${detail}. Keep secrets and personal identifiers out of the vault.`,
    );
  }

  async target(input: string): Promise<WriteTarget> {
    const vaultPath = toVaultPath(input);
    this.policy.assertWritable(vaultPath);
    const absolute = await resolveInside(this.root, vaultPath);
    await mkdir(path.dirname(absolute), { recursive: true });
    return { vaultPath, absolute };
  }

  async create(target: WriteTarget, text: string): Promise<void> {
    await fileLocks.run(target.absolute, async () => {
      try {
        await writeFile(target.absolute, text, { encoding: "utf8", flag: "wx" });
      } catch (error) {
        if (hasErrorCode(error, "EEXIST")) {
          throw new VaultError("ALREADY_EXISTS", `${target.vaultPath} already exists`);
        }
        throw error;
      }
    });
  }

  async update(target: WriteTarget, update: Update): Promise<UpdateResult> {
    return fileLocks.run(target.absolute, async () => {
      const existing = await readIfExists(target.absolute);
      const next = await update(existing);
      if (next === null || next === existing) return { created: false, changed: false };
      await replaceAtomically(target.absolute, next);
      return { created: existing === null, changed: true };
    });
  }
}
