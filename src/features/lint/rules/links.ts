import type { Issue, LintRule } from "../types.js";

export const linksRule: LintRule = (note, { vault }) =>
  vault.graph.outgoing(note.path).flatMap(({ target, line, resolution }): Issue[] => {
    if (resolution.status === "missing") {
      return [{ kind: "broken_link", path: note.path, line, detail: `[[${target}]]` }];
    }
    if (resolution.status === "ambiguous") {
      const detail = `[[${target}]] matches ${resolution.candidates.join(", ")}`;
      return [{ kind: "ambiguous_link", path: note.path, line, detail }];
    }
    return [];
  });
