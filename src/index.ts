export { parseConfig } from "./config/load.js";
export type { SensitivePattern, VaultConfig } from "./config/schema.js";
export { VaultError, type VaultErrorCode } from "./core/errors.js";
export { createServer, type ServerOptions } from "./server/create-server.js";
export {
  type AnyTool,
  callTool,
  defineTool,
  type ToolContext,
  type ToolDefinition,
} from "./tools/define-tool.js";
export {
  diaryAddTool,
  indexBuildTool,
  noteCreateTool,
  noteLinksTool,
  noteReadTool,
  noteSearchTool,
  TOOLS,
  vaultIndexTool,
  vaultLintTool,
} from "./tools/index.js";
export type { Note } from "./vault/note.js";
export type { Resolution } from "./vault/resolver.js";
export { type OpenVaultOptions, Vault } from "./vault/vault.js";
