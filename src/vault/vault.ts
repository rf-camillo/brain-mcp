import { realpath } from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "../config/load.js";
import type { VaultConfig } from "../config/schema.js";
import { VaultError } from "../core/errors.js";
import { isMarkdownFile } from "../core/files.js";
import { AccessPolicy } from "../guards/access-policy.js";
import { resolveInside } from "../guards/containment.js";
import { SensitiveScanner } from "../guards/sensitive/scanner.js";
import { toVaultPath } from "../guards/vault-path.js";
import { LinkGraph } from "./link-graph.js";
import type { Note } from "./note.js";
import { NoteCache } from "./note-cache.js";
import { LinkResolver, type Resolution } from "./resolver.js";
import { walkVault } from "./walk.js";
import { VaultWriter } from "./writer.js";

export interface OpenVaultOptions {
  /** Refuse every write. Defaults to `false`. */
  readOnly?: boolean;
}

/**
 * An Obsidian vault on disk, loaded with its configuration and guards.
 * Call {@link Vault.reload} to pick up changes; only modified files are read again.
 */
export class Vault {
  readonly root: string;
  readonly config: VaultConfig;
  readonly policy: AccessPolicy;
  readonly scanner: SensitiveScanner;
  readonly writer: VaultWriter;
  private readonly cache: NoteCache;
  private notesByPath = new Map<string, Note>();
  private resolver = new LinkResolver([]);
  private linkGraph = new LinkGraph([], this.resolver);

  private constructor(root: string, config: VaultConfig, options: OpenVaultOptions) {
    this.root = root;
    this.config = config;
    this.policy = new AccessPolicy(config, { readOnly: options.readOnly ?? false });
    this.scanner = new SensitiveScanner(config.sensitive);
    this.writer = new VaultWriter(root, this.policy, this.scanner);
    this.cache = new NoteCache(root);
  }

  /** Opens the vault at `root`, reading `brain.config.yaml` and every visible note. */
  static async open(root: string, options: OpenVaultOptions = {}): Promise<Vault> {
    const absoluteRoot = await realpath(path.resolve(root));
    const vault = new Vault(absoluteRoot, await loadConfig(absoluteRoot), options);
    await vault.reload();
    return vault;
  }

  /** Rescans the vault, reading only the files that changed since the last load. */
  async reload(): Promise<void> {
    const files = await walkVault(this.root, this.policy);
    const markdown = files.filter(isMarkdownFile).sort((a, b) => a.localeCompare(b));
    const notes = await this.cache.load(markdown, (file) => this.policy.isIgnored(file));
    this.notesByPath = new Map(notes.map((note) => [note.path, note]));
    this.resolver = new LinkResolver(files);
    this.linkGraph = new LinkGraph(notes, this.resolver);
  }

  get graph(): LinkGraph {
    return this.linkGraph;
  }

  notes(options: { includeIgnored?: boolean } = {}): Note[] {
    const all = [...this.notesByPath.values()];
    return options.includeIgnored ? all : all.filter((note) => !note.ignored);
  }

  resolve(target: string): Resolution {
    return this.resolver.resolve(target);
  }

  getNote(ref: string): Note {
    if (isMarkdownFile(ref)) {
      const vaultPath = toVaultPath(ref);
      this.policy.assertReadable(vaultPath);
      const direct = this.notesByPath.get(vaultPath);
      if (direct) return direct;
    }
    const resolution = this.resolve(ref);
    if (resolution.status === "ambiguous") {
      throw new VaultError(
        "AMBIGUOUS",
        `"${ref}" matches more than one note: ${resolution.candidates.join(", ")}`,
      );
    }
    const note = resolution.status === "found" ? this.notesByPath.get(resolution.path) : undefined;
    if (!note) throw new VaultError("NOT_FOUND", `No note matches "${ref}"`);
    return note;
  }

  backlinks(vaultPath: string): Note[] {
    return this.linkGraph
      .linkedFrom(vaultPath)
      .flatMap((source) => this.notesByPath.get(source) ?? []);
  }

  async absolutePath(vaultPath: string): Promise<string> {
    return resolveInside(this.root, toVaultPath(vaultPath));
  }
}
