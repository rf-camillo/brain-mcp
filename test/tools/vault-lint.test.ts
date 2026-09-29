import { describe, expect, it } from "vitest";

import { callTool } from "../../src/tools/define-tool.js";
import { vaultLintTool } from "../../src/tools/index.js";
import { Vault } from "../../src/vault/vault.js";
import { createVault, note } from "../support/helpers.js";

const NOW = { now: new Date(2026, 8, 29, 10, 0) };

async function messyVault(): Promise<string> {
  return createVault({
    "brain.config.yaml": "blocked:\n  - private/**\n",
    "index.md": note({ type: "index", summary: "Catalog" }, "# Index\n\n- [[Launch]]\n- [[Ana]]"),
    "Launch.md": note(
      { type: "project", summary: "The launch" },
      "# Launch\n\n[[Ana]] and [[Ghost]] and [[Dup]].\n\nSSN 123-45-6789",
    ),
    "Ana.md": note({ type: "person" }, "# Ana\n\n[[Launch]]"),
    "a/Dup.md": note({ type: "x", summary: "a" }, "# Dup"),
    "b/Dup.md": note({ type: "x", summary: "b" }, "# Dup"),
    "Loose.md": "# No frontmatter",
    "Broken.md": "---\nkey: [oops\n---\n# Broken",
    "diary/2026/2026-09-29.md": "---\ntype: diary\n---\n# Today",
    "diary/2026/2026-09-28.md": "---\ntype: diary\n---\n# Yesterday",
    "private/Secret.md": "# Secret\n\nSSN 987-65-4321 [[Nowhere]]",
  });
}

describe("vault_lint", () => {
  it("reports each kind of issue", async () => {
    const vault = await Vault.open(await messyVault());
    const result = await callTool(vaultLintTool, vault, {}, NOW);
    const summary = result.issues.map((issue) => `${issue.kind} ${issue.path} ${issue.detail}`);
    expect(summary).toEqual([
      "invalid_frontmatter Broken.md " + (result.issues[0]?.detail ?? ""),
      "missing_frontmatter Loose.md No frontmatter block",
      'missing_field Ana.md Missing "summary"',
      'missing_field diary/2026/2026-09-28.md Missing "summary"',
      "broken_link Launch.md [[Ghost]]",
      "ambiguous_link Launch.md [[Dup]] matches a/Dup.md, b/Dup.md",
      "orphan a/Dup.md No other note links here",
      "orphan b/Dup.md No other note links here",
      "orphan Broken.md No other note links here",
      "orphan Loose.md No other note links here",
      "not_in_index a/Dup.md Run index_build",
      "not_in_index b/Dup.md Run index_build",
      "not_in_index Broken.md Run index_build",
      "not_in_index diary/2026/2026-09-28.md Run index_build",
      "not_in_index diary/2026/2026-09-29.md Run index_build",
      "not_in_index Loose.md Run index_build",
      "sensitive Launch.md Looks like a US social security number",
    ]);
    expect(result.counts.orphan).toBe(4);
    expect(result.checked).toBe(9);
  });

  it("points to the line in the file", async () => {
    const vault = await Vault.open(await messyVault());
    const result = await callTool(
      vaultLintTool,
      vault,
      { kinds: ["broken_link", "sensitive"] },
      NOW,
    );
    expect(result.issues.map((issue) => [issue.kind, issue.line])).toEqual([
      ["broken_link", 8],
      ["sensitive", 10],
    ]);
  });

  it("never inspects blocked notes", async () => {
    const vault = await Vault.open(await messyVault());
    const result = await callTool(vaultLintTool, vault, {}, NOW);
    expect(result.issues.some((issue) => issue.path.startsWith("private/"))).toBe(false);
  });

  it("filters by kind and folder", async () => {
    const vault = await Vault.open(await messyVault());
    expect(
      (await callTool(vaultLintTool, vault, { kinds: ["orphan"], folder: "a" }, NOW)).issues,
    ).toEqual([{ kind: "orphan", path: "a/Dup.md", detail: "No other note links here" }]);
  });

  it("is clean on a healthy vault", async () => {
    const root = await createVault({
      "index.md": note({ type: "index", summary: "Catalog" }, "# Index\n\n- [[A]]"),
      "A.md": note({ type: "x", summary: "a" }, "# A"),
    });
    expect(await callTool(vaultLintTool, await Vault.open(root), {}, NOW)).toEqual({
      checked: 2,
      total: 0,
      counts: {},
      issues: [],
    });
  });
});
