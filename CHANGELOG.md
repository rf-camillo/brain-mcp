# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

### Added

- MCP server over stdio with eight tools: `vault_index`, `note_search`, `note_read`, `note_links`, `vault_lint`, `diary_add`, `note_create` and `index_build`, each with input and output schemas.
- Guards: blocked folders, opt-in writable folders, no overwrite or delete, path and symlink containment, sensitive content detection and a read-only mode.
- `brain.config.yaml` with strict validation.
- JSON CLI (`brain`) with the same operations.
- Incremental reload: only files whose size or modification time changed are read again.
- Per-file write lock and atomic replacement, so concurrent tool calls never lose entries.
- Library entry point with type declarations (`createServer`, `Vault`, tools, `callTool`).
- Fictional example vault and documentation.
