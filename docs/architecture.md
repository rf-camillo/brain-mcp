# Architecture

`brain-mcp` is a small TypeScript library with two front ends, an MCP server over stdio and a JSON CLI. Both run the same tool definitions.

```
src/
  index.ts      public API for use as a library
  bin/          entry points: mcp.ts (server) and cli.ts
  server/       create-server.ts registers the tools; to-result.ts maps results and errors
  cli/          options.ts (argv), args.ts (flag parsing), commands.ts (command → tool), run.ts
  core/         errors, fs helpers, bounded concurrency, globs, dates, file names, version
  config/       schema.ts (zod) and load.ts (brain.config.yaml)
  markdown/     frontmatter, title, wikilinks, sections, code fences, text folding
  guards/       vault-path.ts, containment.ts, access-policy.ts and sensitive/ (detectors, Luhn, scanner)
  vault/        vault.ts, walk.ts, note-cache.ts, note.ts, resolver.ts, link-graph.ts, lock.ts, writer.ts
  features/     filters, search/, diary/, notes/, catalog/ and lint/ (one file per rule)
  tools/        define-tool.ts, shared schemas and one thin adapter per tool
```

Dependencies point one way: `core` ← `config` ← `markdown` ← `guards` ← `vault` ← `features` ← `tools` ← `server` ← `cli` ← `bin`. `.dependency-cruiser.cjs` turns that order into build errors, together with a ban on import cycles and orphan modules, so the layering cannot drift.

## Tools are definitions

Each tool is declared once with `defineTool`: a name, a title, a description written for the model, whether it reads or writes, a zod input schema, a zod output schema and a `run(vault, args, context)` function. The server passes both schemas to the MCP SDK, returns the result as structured content plus JSON text, and turns a `VaultError` into a tool error with its code. The CLI maps a command to the same definition and prints JSON. Tests call the definitions directly through `callTool`, which validates the input first.

Tools are adapters: they declare schemas and call a function in `features/`, where the behavior lives and is tested on its own. The `context` carries the current time, which keeps diary and lint tests deterministic.

## Loading the vault

`Vault.open(root)` reads `brain.config.yaml`, walks the folder tree and parses every Markdown file. The walk prunes dot folders, `node_modules` and blocked folders before descending, and skips symbolic links entirely, so a blocked or outside file is never even opened.

After loading, the vault builds a `LinkResolver` from every file path and a `LinkGraph` that resolves every link once. Backlinks, orphan detection and index coverage read from the graph instead of resolving links again.

The server calls `vault.reload()` before each tool call, so the agent sees edits made in Obsidian. `NoteCache` keeps each parsed note with the file's size and modification time and only rereads files that changed, with at most 32 reads in flight. Parsed notes are immutable and reused, so derived data such as the folded text used by search is cached per note in a `WeakMap`.

## Resolving wikilinks

Resolution follows Obsidian:

1. An exact path without extension (`projects/Launch Plan`).
2. A bare name that is unique in the vault (`Launch Plan`). Attachments count too.
3. A path suffix that is unique (`people/Ana` when there is `team/people/Ana.md`).

Two or more candidates make the link `ambiguous`, and the candidates are returned. Headings (`#Risks`) are stripped before resolving. Matching is case-insensitive.

## Reads and writes

A read goes through `AccessPolicy.assertReadable`, which reports blocked paths as `NOT_FOUND`.

A write goes through, in order:

1. Input validation (zod) and tool-specific checks, such as required frontmatter or a valid diary section.
2. The sensitive content scan, on the exact text that would be written.
3. `toVaultPath`: rejects absolute paths, `..` and empty paths.
4. `AccessPolicy.assertWritable`: read-only mode, blocked paths, the `writable` globs, and the config file.
5. `resolveInside`: resolves symbolic links on the nearest existing ancestor and rejects anything outside the vault. The vault root itself is resolved with `realpath` when the vault opens, so a vault reached through a symlink works.
6. The write itself, under a per-file lock (`KeyedLock`): `wx` for new files, so nothing is ever overwritten; for the diary and the index, read, transform and replace atomically through a uniquely named temporary file that is removed if the rename fails. The lock makes concurrent tool calls on the same note safe.

## Errors

| Code                  | Meaning                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `NOT_FOUND`           | No such note or section, or the path is blocked                  |
| `AMBIGUOUS`           | The reference matches more than one note; the message lists them |
| `OUTSIDE_VAULT`       | The path escapes the vault                                       |
| `INVALID_PATH`        | Empty or malformed path                                          |
| `NOT_WRITABLE`        | The path is not covered by `writable`                            |
| `READ_ONLY`           | The server was started with `--read-only`                        |
| `ALREADY_EXISTS`      | `note_create` would overwrite a file                             |
| `SENSITIVE_CONTENT`   | The content looks like a secret or personal identifier           |
| `INVALID_FRONTMATTER` | Required frontmatter is missing                                  |
| `INVALID_INPUT`       | Arguments are invalid, for example an unknown diary section      |
| `INVALID_CONFIG`      | `brain.config.yaml` is invalid; reported at startup              |

## Testing

- Unit tests for every module in `core`, `config`, `markdown`, `guards` and `vault`, and for each lint rule on its own.
- Regression tests for concurrent writes, symlinked vault roots, folders named `..something` and timestamps that pass the Luhn check.
- Tool tests on temporary vaults, including symlink escapes, blocked folders and atomic no-overwrite.
- Server tests through the SDK's in-memory transport: handshake, tool list, annotations and output schemas, structured content, read-only mode, error mapping and live reload.
- CLI tests for every command and its exit codes.

CI runs formatting, lint, typecheck, tests and the build on Node.js 20, 22 and 24.
