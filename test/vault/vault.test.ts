import { realpath, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { Vault } from "../../src/vault/vault.js";
import { createVault, note, tempDir } from "../support/helpers.js";

async function sampleVault(): Promise<string> {
  return createVault({
    "brain.config.yaml": "blocked:\n  - private/**\n",
    "index.md": note({ type: "index", summary: "Catalog" }, "# Index"),
    "projects/Launch Plan.md": note(
      { type: "project", summary: "Plan for the launch" },
      "# Launch Plan\n\nOwner: [[Ana]]. Risks in [[Risks]].",
    ),
    "people/Ana.md": note({ type: "person", summary: "Product lead" }, "# Ana\n\n[[Launch Plan]]"),
    "archive/Ana.md": note({ type: "person", summary: "Old Ana" }, "# Ana (old)"),
    "private/Salary.md": note({ type: "private", summary: "Secret" }, "[[Launch Plan]]"),
    "templates/Daily.md": "# {{date}}",
    ".obsidian/workspace.json": "{}",
    "assets/diagram.png": "png",
  });
}

describe("Vault", () => {
  it("loads notes, skipping blocked, hidden and ignored ones", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(vault.notes().map((n) => n.path)).toEqual([
      "archive/Ana.md",
      "index.md",
      "people/Ana.md",
      "projects/Launch Plan.md",
    ]);
    expect(vault.notes({ includeIgnored: true }).map((n) => n.path)).toContain(
      "templates/Daily.md",
    );
  });

  it("parses title, frontmatter and links", async () => {
    const vault = await Vault.open(await sampleVault());
    const plan = vault.getNote("projects/Launch Plan.md");
    expect(plan.title).toBe("Launch Plan");
    expect(plan.frontmatter).toMatchObject({ type: "project" });
    expect(plan.links.map((link) => link.target)).toEqual(["Ana", "Risks"]);
  });

  it("resolves wikilinks like Obsidian", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(vault.resolve("Launch Plan")).toEqual({
      status: "found",
      path: "projects/Launch Plan.md",
    });
    expect(vault.resolve("launch plan#Risks")).toMatchObject({ status: "found" });
    expect(vault.resolve("people/Ana")).toEqual({ status: "found", path: "people/Ana.md" });
    expect(vault.resolve("diagram.png")).toEqual({ status: "found", path: "assets/diagram.png" });
    expect(vault.resolve("Ana")).toEqual({
      status: "ambiguous",
      candidates: ["archive/Ana.md", "people/Ana.md"],
    });
    expect(vault.resolve("Risks")).toEqual({ status: "missing" });
  });

  it("never resolves or returns blocked notes", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(vault.resolve("Salary")).toEqual({ status: "missing" });
    expect(() => vault.getNote("private/Salary.md")).toThrow(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
    expect(() => vault.getNote("Salary")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("explains ambiguous references", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(() => vault.getNote("Ana")).toThrow(expect.objectContaining({ code: "AMBIGUOUS" }));
  });

  it("finds backlinks without leaking blocked notes", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(vault.backlinks("projects/Launch Plan.md").map((n) => n.path)).toEqual([
      "people/Ana.md",
    ]);
  });

  it("rejects paths that escape the vault", async () => {
    const vault = await Vault.open(await sampleVault());
    expect(() => vault.getNote("../outside.md")).toThrow(
      expect.objectContaining({ code: "OUTSIDE_VAULT" }),
    );
  });

  it("skips symlinks so they cannot pull outside files in", async () => {
    const root = await sampleVault();
    const outside = await createVault({
      "leak.md": note({ type: "x", summary: "leak" }, "# Leak"),
    });
    await symlink(outside, path.join(root, "linked"));
    await symlink(path.join(outside, "leak.md"), path.join(root, "leak.md"));
    const vault = await Vault.open(root);
    expect(vault.notes().some((n) => n.path.includes("leak"))).toBe(false);
  });

  it("works without a config file", async () => {
    const root = await tempDir();
    const vault = await Vault.open(root);
    expect(vault.notes()).toEqual([]);
  });

  it("opens a vault reached through a symlink", async () => {
    const real = await sampleVault();
    const link = path.join(await tempDir(), "vault-link");
    await symlink(real, link);
    const vault = await Vault.open(link);
    expect(vault.root).toBe(await realpath(real));
    await expect(vault.absolutePath("notes/new.md")).resolves.toBe(
      path.join(vault.root, "notes", "new.md"),
    );
  });

  it("reuses unchanged notes and rereads modified ones", async () => {
    const root = await sampleVault();
    const vault = await Vault.open(root);
    const before = vault.getNote("people/Ana.md");
    const plan = vault.getNote("projects/Launch Plan.md");
    await writeFile(
      path.join(root, "people", "Ana.md"),
      note({ type: "person", summary: "Changed" }, "# Ana v2"),
    );
    await vault.reload();
    expect(vault.getNote("projects/Launch Plan.md")).toBe(plan);
    expect(vault.getNote("people/Ana.md")).not.toBe(before);
    expect(vault.getNote("people/Ana.md").title).toBe("Ana v2");
  });

  it("drops deleted notes on reload", async () => {
    const root = await sampleVault();
    const vault = await Vault.open(root);
    await rm(path.join(root, "archive", "Ana.md"));
    await vault.reload();
    expect(vault.resolve("Ana")).toEqual({ status: "found", path: "people/Ana.md" });
  });
});
