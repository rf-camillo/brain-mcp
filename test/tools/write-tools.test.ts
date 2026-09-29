import { readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { callTool } from "../../src/tools/define-tool.js";
import {
  diaryAddTool,
  indexBuildTool,
  noteCreateTool,
  vaultIndexTool,
} from "../../src/tools/index.js";
import { Vault } from "../../src/vault/vault.js";
import { createVault, note, tempDir } from "../support/helpers.js";

const CONFIG = [
  "blocked:",
  "  - inbox/private/**",
  "writable:",
  "  - inbox/**",
  "  - diary/**",
  "diary:",
  "  sections: [Product, Engineering, Decisions]",
].join("\n");

const NOON = new Date(2026, 8, 29, 12, 5);

async function writableVault(extra: Record<string, string> = {}): Promise<string> {
  return createVault({
    "brain.config.yaml": CONFIG,
    "people/Ana.md": note({ type: "person", summary: "Product lead" }, "# Ana"),
    ...extra,
  });
}

async function read(root: string, file: string): Promise<string> {
  return readFile(path.join(root, ...file.split("/")), "utf8");
}

describe("diary_add", () => {
  it("creates the day and logs under the section", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    const result = await callTool(
      diaryAddTool,
      vault,
      { text: "Shipped the pricing page", section: "product" },
      { now: NOON },
    );
    expect(result).toEqual({
      path: "diary/2026/2026-09-29.md",
      section: "Product",
      entry: "- 12:05 Shipped the pricing page",
      created: true,
    });
    expect(await read(root, result.path)).toBe(
      "---\ntype: diary\ndate: 2026-09-29\n---\n\n# 2026-09-29\n\n## Product\n\n- 12:05 Shipped the pricing page\n",
    );
  });

  it("appends to an existing section and keeps the configured order", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    const log = (text: string, section: string, minutes: number) =>
      callTool(diaryAddTool, vault, { text, section }, { now: new Date(2026, 8, 29, 9, minutes) });
    await log("Decided on annual plans", "Decisions", 0);
    await log("Fixed the webhook retry", "Engineering", 10);
    await log("Talked to two users", "Product", 20);
    await log("Added idempotency keys", "Engineering", 30);
    const text = await read(root, "diary/2026/2026-09-29.md");
    expect(text.split("\n# 2026-09-29\n")[1]).toBe(
      [
        "",
        "## Product",
        "",
        "- 09:20 Talked to two users",
        "",
        "## Engineering",
        "",
        "- 09:10 Fixed the webhook retry",
        "- 09:30 Added idempotency keys",
        "",
        "## Decisions",
        "",
        "- 09:00 Decided on annual plans",
        "",
      ].join("\n"),
    );
  });

  it("uses the configured template", async () => {
    const root = await createVault({
      "brain.config.yaml": "diary:\n  template: templates/Day.md\n",
      "templates/Day.md": "---\ntype: diary\ndate: {{date}}\nsummary: ''\n---\n\n# Day {{date}}\n",
    });
    const vault = await Vault.open(root);
    await callTool(
      diaryAddTool,
      vault,
      { text: "Hello", time: false, date: "2026-01-02" },
      { now: NOON },
    );
    expect(await read(root, "diary/2026/2026-01-02.md")).toBe(
      "---\ntype: diary\ndate: 2026-01-02\nsummary: ''\n---\n\n# Day 2026-01-02\n\n- Hello\n",
    );
  });

  it("flattens multi-line text into one entry", async () => {
    const vault = await Vault.open(await writableVault());
    const result = await callTool(
      diaryAddTool,
      vault,
      { text: "First line\n  second line", section: "Product", time: false },
      { now: NOON },
    );
    expect(result.entry).toBe("- First line second line");
  });

  it("requires a known section when sections are configured", async () => {
    const vault = await Vault.open(await writableVault());
    await expect(callTool(diaryAddTool, vault, { text: "x" }, { now: NOON })).rejects.toMatchObject(
      {
        code: "INVALID_INPUT",
      },
    );
    await expect(
      callTool(diaryAddTool, vault, { text: "x", section: "Random" }, { now: NOON }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("keeps every entry when writes to the same day run at once", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) =>
        callTool(
          diaryAddTool,
          vault,
          { text: `entry ${String(index)}`, section: "Product", time: false },
          { now: NOON },
        ),
      ),
    );
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    const text = await read(root, "diary/2026/2026-09-29.md");
    expect(text.split("\n").filter((line) => line.startsWith("- entry "))).toHaveLength(8);
  });

  it("refuses sensitive content and leaves no file behind", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    await expect(
      callTool(
        diaryAddTool,
        vault,
        { text: "Card 4111 1111 1111 1111", section: "Product" },
        { now: NOON },
      ),
    ).rejects.toMatchObject({ code: "SENSITIVE_CONTENT" });
    await expect(read(root, "diary/2026/2026-09-29.md")).rejects.toThrow();
  });

  it("refuses to write when the diary folder is not writable", async () => {
    const vault = await Vault.open(await createVault({ "brain.config.yaml": "writable: []\n" }));
    await expect(callTool(diaryAddTool, vault, { text: "x" }, { now: NOON })).rejects.toMatchObject(
      {
        code: "NOT_WRITABLE",
      },
    );
  });
});

describe("note_create", () => {
  it("creates a note with frontmatter and a title", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    const result = await callTool(noteCreateTool, vault, {
      path: "inbox/Churn Idea",
      frontmatter: { type: "idea", summary: "Ask churned users why", tags: ["growth"] },
      body: "Talk to [[Ana]] about it.",
    });
    expect(result).toEqual({ path: "inbox/Churn Idea.md", title: "Churn Idea", warnings: [] });
    expect(await read(root, "inbox/Churn Idea.md")).toBe(
      "---\ntype: idea\nsummary: Ask churned users why\ntags:\n  - growth\n---\n\n# Churn Idea\n\nTalk to [[Ana]] about it.\n",
    );
  });

  it("keeps an existing heading", async () => {
    const root = await writableVault();
    const vault = await Vault.open(root);
    await callTool(noteCreateTool, vault, {
      path: "inbox/a.md",
      frontmatter: { type: "idea", summary: "x" },
      body: "# Custom Title\n\nText",
    });
    expect(await read(root, "inbox/a.md")).toContain("\n# Custom Title\n\nText\n");
  });

  it("warns about broken links and name clashes", async () => {
    const vault = await Vault.open(await writableVault());
    const result = await callTool(noteCreateTool, vault, {
      path: "inbox/Ana.md",
      frontmatter: { type: "person", summary: "Duplicate" },
      body: "See [[Nobody]].",
    });
    expect(result.warnings).toEqual([
      'Another file is already named "Ana"; wikilinks to [[Ana]] become ambiguous.',
      "Link [[Nobody]] has no target yet.",
    ]);
  });

  it("requires the configured frontmatter", async () => {
    const vault = await Vault.open(await writableVault());
    await expect(
      callTool(noteCreateTool, vault, {
        path: "inbox/x.md",
        frontmatter: { type: "idea", summary: " " },
      }),
    ).rejects.toMatchObject({
      code: "INVALID_FRONTMATTER",
      message: "Missing required frontmatter: summary",
    });
  });

  it("never overwrites", async () => {
    const root = await writableVault({ "inbox/Taken.md": "original" });
    const vault = await Vault.open(root);
    await expect(
      callTool(noteCreateTool, vault, {
        path: "inbox/Taken.md",
        frontmatter: { type: "a", summary: "b" },
      }),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    expect(await read(root, "inbox/Taken.md")).toBe("original");
  });

  it("writes only to writable folders, never to blocked ones or the config", async () => {
    const vault = await Vault.open(await writableVault());
    const create = (target: string) =>
      callTool(noteCreateTool, vault, { path: target, frontmatter: { type: "a", summary: "b" } });
    await expect(create("people/New.md")).rejects.toMatchObject({ code: "NOT_WRITABLE" });
    await expect(create("inbox/private/New.md")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(create("brain.config.yaml")).rejects.toMatchObject({ code: "NOT_WRITABLE" });
    await expect(create("../escape.md")).rejects.toMatchObject({ code: "OUTSIDE_VAULT" });
  });

  it("refuses to follow a symlink out of the vault", async () => {
    const root = await writableVault();
    const outside = await tempDir();
    await symlink(outside, path.join(root, "inbox"));
    const vault = await Vault.open(root);
    await expect(
      callTool(noteCreateTool, vault, {
        path: "inbox/x.md",
        frontmatter: { type: "a", summary: "b" },
      }),
    ).rejects.toMatchObject({ code: "OUTSIDE_VAULT" });
  });

  it("refuses secrets in the body or frontmatter", async () => {
    const vault = await Vault.open(await writableVault());
    await expect(
      callTool(noteCreateTool, vault, {
        path: "inbox/keys.md",
        frontmatter: { type: "a", summary: "b", token: `ghp_${"a".repeat(36)}` },
      }),
    ).rejects.toMatchObject({ code: "SENSITIVE_CONTENT" });
  });
});

describe("index_build", () => {
  async function indexedVault(): Promise<string> {
    return createVault({
      "index.md": "old",
      "projects/Launch.md": note({ type: "project", summary: "The launch" }, "# Launch"),
      "people/Ana.md": note({ type: "person", summary: "Product lead" }, "# Ana"),
      "archive/Ana.md": note({ type: "person", summary: "Old" }, "# Ana"),
      "Readme.md": "# Readme",
      "templates/T.md": "# T",
    });
  }

  it("renders one line per note, grouped by folder", async () => {
    const vault = await Vault.open(await indexedVault());
    const { content, notes } = await callTool(indexBuildTool, vault, { dryRun: true });
    expect(notes).toBe(4);
    expect(content).toContain("## Root\n\n- [[Readme]]\n");
    expect(content).toContain("## archive\n\n- [[archive/Ana|Ana]] · `person` Old\n");
    expect(content).toContain("## people\n\n- [[people/Ana|Ana]] · `person` Product lead\n");
    expect(content).toContain("## projects\n\n- [[Launch]] · `project` The launch\n");
    expect(content).not.toContain("templates");
  });

  it("writes the index and is idempotent", async () => {
    const root = await indexedVault();
    const vault = await Vault.open(root);
    expect(await callTool(indexBuildTool, vault, {})).toMatchObject({
      written: true,
    });
    await vault.reload();
    expect(await callTool(indexBuildTool, vault, {})).toMatchObject({
      written: false,
    });
    expect((await callTool(vaultIndexTool, vault, { type: "index" })).notes[0]?.summary).toBe(
      "Catalog of every note with its one-line summary",
    );
  });

  it("does not write in dry-run mode", async () => {
    const root = await indexedVault();
    await callTool(indexBuildTool, await Vault.open(root), { dryRun: true });
    expect(await read(root, "index.md")).toBe("old");
  });

  it("respects read-only mode", async () => {
    const vault = await Vault.open(await indexedVault(), { readOnly: true });
    await expect(callTool(indexBuildTool, vault, {})).rejects.toMatchObject({ code: "READ_ONLY" });
  });

  it("writes to a custom index path", async () => {
    const root = await createVault({ "brain.config.yaml": "index:\n  path: Home.md\n" });
    await writeFile(path.join(root, "a.md"), note({ type: "x", summary: "y" }, "# a"));
    const result = await callTool(indexBuildTool, await Vault.open(root), {});
    expect(result.path).toBe("Home.md");
    expect(await read(root, "Home.md")).toContain("- [[a]] · `x` y");
  });
});
