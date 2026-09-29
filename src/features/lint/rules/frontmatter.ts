import { missingFields } from "../../../markdown/frontmatter.js";
import type { LintRule } from "../types.js";

export const frontmatterRule: LintRule = (note, { vault, openDiaryPath }) => {
  if (note.frontmatterError !== null) {
    return [{ kind: "invalid_frontmatter", path: note.path, detail: note.frontmatterError }];
  }
  if (note.frontmatter === null) {
    return [{ kind: "missing_frontmatter", path: note.path, detail: "No frontmatter block" }];
  }
  if (note.path === openDiaryPath) return [];
  return missingFields(note.frontmatter, vault.config.frontmatter.required).map((key) => ({
    kind: "missing_field",
    path: note.path,
    detail: `Missing "${key}"`,
  }));
};
