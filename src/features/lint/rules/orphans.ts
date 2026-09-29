import type { LintRule } from "../types.js";

const README = /(^|\/)README\.md$/i;

export const orphanRule: LintRule = (note, { vault, indexPath, isDiaryNote }) => {
  const isEntryPoint = note.path === indexPath || README.test(note.path) || isDiaryNote(note.path);
  if (isEntryPoint || vault.graph.linkedFrom(note.path).length > 0) return [];
  return [{ kind: "orphan", path: note.path, detail: "No other note links here" }];
};
