import { describe, expect, it } from "vitest";

import { frontmatterRule } from "../../../src/features/lint/rules/frontmatter.js";
import { indexCoverageRule } from "../../../src/features/lint/rules/index-coverage.js";
import { linksRule } from "../../../src/features/lint/rules/links.js";
import { orphanRule } from "../../../src/features/lint/rules/orphans.js";
import { sensitiveRule } from "../../../src/features/lint/rules/sensitive.js";
import type { LintContext } from "../../../src/features/lint/types.js";
import { Vault } from "../../../src/vault/vault.js";
import { createVault, note } from "../../support/helpers.js";

async function context(files: Record<string, string>, overrides: Partial<LintContext> = {}) {
  const vault = await Vault.open(await createVault(files));
  const base: LintContext = {
    vault,
    openDiaryPath: "diary/2026/2026-09-29.md",
    isDiaryNote: (path) => path.startsWith("diary/"),
    indexPath: "index.md",
    indexedPaths: null,
    ...overrides,
  };
  return { vault, context: base };
}

describe("lint rules", () => {
  it("frontmatter: reports missing fields but spares the open diary", async () => {
    const { vault, context: ctx } = await context({
      "A.md": note({ type: "x" }, "# A"),
      "diary/2026/2026-09-29.md": note({ type: "diary" }, "# Today"),
    });
    expect(frontmatterRule(vault.getNote("A.md"), ctx)).toEqual([
      { kind: "missing_field", path: "A.md", detail: 'Missing "summary"' },
    ]);
    expect(frontmatterRule(vault.getNote("diary/2026/2026-09-29.md"), ctx)).toEqual([]);
  });

  it("links: reports broken and ambiguous links with their line", async () => {
    const { vault, context: ctx } = await context({
      "A.md": "# A\n\n[[Ghost]] [[Dup]]",
      "x/Dup.md": "# Dup",
      "y/Dup.md": "# Dup",
    });
    expect(linksRule(vault.getNote("A.md"), ctx).map((issue) => [issue.kind, issue.line])).toEqual([
      ["broken_link", 3],
      ["ambiguous_link", 3],
    ]);
  });

  it("orphans: spares the index, READMEs and diary notes", async () => {
    const { vault, context: ctx } = await context({
      "index.md": "# Index",
      "README.md": "# Readme",
      "diary/2026/2026-01-01.md": "# Day",
      "Lonely.md": "# Lonely",
    });
    const orphans = vault
      .notes()
      .flatMap((n) => orphanRule(n, ctx))
      .map((issue) => issue.path);
    expect(orphans).toEqual(["Lonely.md"]);
  });

  it("index coverage: only runs when an index exists", async () => {
    const { vault, context: ctx } = await context({ "A.md": "# A" });
    expect(indexCoverageRule(vault.getNote("A.md"), ctx)).toEqual([]);
    expect(indexCoverageRule(vault.getNote("A.md"), { ...ctx, indexedPaths: new Set() })).toEqual([
      { kind: "not_in_index", path: "A.md", detail: "Run index_build" },
    ]);
  });

  it("sensitive: checks the body with file lines and the frontmatter", async () => {
    const { vault, context: ctx } = await context({
      "A.md": note(
        { type: "x", summary: "y", token: `ghp_${"a".repeat(36)}` },
        "# A\n\nSSN 123-45-6789",
      ),
    });
    expect(sensitiveRule(vault.getNote("A.md"), ctx)).toEqual([
      {
        kind: "sensitive",
        path: "A.md",
        line: 9,
        detail: "Looks like a US social security number",
      },
      { kind: "sensitive", path: "A.md", detail: "Frontmatter looks sensitive" },
    ]);
  });
});
