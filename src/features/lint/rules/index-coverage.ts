import type { LintRule } from "../types.js";

export const indexCoverageRule: LintRule = (note, { indexPath, indexedPaths }) => {
  if (indexedPaths === null || note.path === indexPath || indexedPaths.has(note.path)) return [];
  return [{ kind: "not_in_index", path: note.path, detail: "Run index_build" }];
};
