import type { AnyTool } from "./define-tool.js";
import { diaryAddTool } from "./diary-add.js";
import { indexBuildTool } from "./index-build.js";
import { noteCreateTool } from "./note-create.js";
import { noteLinksTool } from "./note-links.js";
import { noteReadTool } from "./note-read.js";
import { noteSearchTool } from "./note-search.js";
import { vaultIndexTool } from "./vault-index.js";
import { vaultLintTool } from "./vault-lint.js";

export {
  diaryAddTool,
  indexBuildTool,
  noteCreateTool,
  noteLinksTool,
  noteReadTool,
  noteSearchTool,
  vaultIndexTool,
  vaultLintTool,
};

/** Every tool, in the order clients list them: reads first, then writes. */
export const TOOLS: readonly AnyTool[] = [
  vaultIndexTool,
  noteSearchTool,
  noteReadTool,
  noteLinksTool,
  vaultLintTool,
  diaryAddTool,
  noteCreateTool,
  indexBuildTool,
];
