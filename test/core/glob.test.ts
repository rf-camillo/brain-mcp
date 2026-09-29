import { describe, expect, it } from "vitest";

import { GlobSet, globToRegExp } from "../../src/core/glob.js";

describe("globToRegExp", () => {
  it.each([
    ["private/**", "private/a.md", true],
    ["private/**", "private/deep/a.md", true],
    ["private/**", "public/private/a.md", false],
    ["**/secret/**", "secret/a.md", true],
    ["**/secret/**", "a/b/secret/c.md", true],
    ["**/secret/**", "a/secrets/c.md", false],
    ["*.md", "note.md", true],
    ["*.md", "dir/note.md", false],
    ["**/*.md", "dir/note.md", true],
    ["**/*.md", "note.md", true],
    ["diary/????/*.md", "diary/2026/2026-01-01.md", true],
    ["notes (old)/*.md", "notes (old)/a.md", true],
  ])("%s against %s is %s", (glob, candidate, expected) => {
    expect(globToRegExp(glob).test(candidate)).toBe(expected);
  });

  it("treats a directory as matched when its contents are", () => {
    const set = new GlobSet(["private/**"]);
    expect(set.matchesDirectory("private")).toBe(true);
    expect(set.matchesDirectory("public")).toBe(false);
  });
});
