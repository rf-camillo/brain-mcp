import type { Issue, LintRule } from "../types.js";

export const sensitiveRule: LintRule = (note, { vault }) => {
  const inBody = vault.scanner.scan(note.body).map(({ name, line }): Issue => ({
    kind: "sensitive",
    path: note.path,
    line: note.bodyLine + line - 1,
    detail: `Looks like a ${name}`,
  }));
  const frontmatterFlagged =
    note.frontmatter !== null && vault.scanner.scan(JSON.stringify(note.frontmatter)).length > 0;
  const inFrontmatter: Issue[] = frontmatterFlagged
    ? [{ kind: "sensitive", path: note.path, detail: "Frontmatter looks sensitive" }]
    : [];
  return [...inBody, ...inFrontmatter];
};
