import { CONFIG_FILE } from "../config/load.js";
import type { VaultConfig } from "../config/schema.js";
import { VaultError } from "../core/errors.js";
import { GlobSet } from "../core/glob.js";

const ALWAYS_HIDDEN_FOLDER = "node_modules";

function isAlwaysHidden(segment: string): boolean {
  return segment.startsWith(".") || segment === ALWAYS_HIDDEN_FOLDER;
}

export class AccessPolicy {
  readonly readOnly: boolean;
  private readonly blocked: GlobSet;
  private readonly ignored: GlobSet;
  private readonly writable: GlobSet;

  constructor(config: VaultConfig, options: { readOnly: boolean }) {
    this.readOnly = options.readOnly;
    this.blocked = new GlobSet(config.blocked);
    this.ignored = new GlobSet(config.ignored);
    this.writable = new GlobSet([...config.writable, config.index.path]);
  }

  isHidden(vaultPath: string): boolean {
    const segments = vaultPath.split("/");
    if (segments.some(isAlwaysHidden)) return true;
    const ancestors = segments.slice(0, -1).map((_, i) => segments.slice(0, i + 1).join("/"));
    return (
      ancestors.some((dir) => this.blocked.matchesDirectory(dir)) || this.blocked.matches(vaultPath)
    );
  }

  isHiddenDirectory(dir: string): boolean {
    return this.isHidden(dir) || this.blocked.matchesDirectory(dir);
  }

  isIgnored(vaultPath: string): boolean {
    return this.ignored.matches(vaultPath);
  }

  assertReadable(vaultPath: string): void {
    if (this.isHidden(vaultPath)) throw new VaultError("NOT_FOUND", `No note at ${vaultPath}`);
  }

  assertWritable(vaultPath: string): void {
    if (this.readOnly) {
      throw new VaultError("READ_ONLY", "The server is running in read-only mode");
    }
    this.assertReadable(vaultPath);
    if (vaultPath === CONFIG_FILE || !this.writable.matches(vaultPath)) {
      throw new VaultError(
        "NOT_WRITABLE",
        `Writing to ${vaultPath} is not allowed by the "writable" setting`,
      );
    }
  }
}
