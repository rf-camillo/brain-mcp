import { describe, expect, it } from "vitest";

import { extractSection } from "../../src/markdown/sections.js";
import { callTool } from "../../src/tools/define-tool.js";
import {
  noteLinksTool,
  noteReadTool,
  noteSearchTool,
  vaultIndexTool,
} from "../../src/tools/index.js";
import { Vault } from "../../src/vault/vault.js";
import { teamVault } from "../support/fixtures.js";
import { createVault } from "../support/helpers.js";

describe("vault_index", () => {
  it("lists visible notes with title, type and summary", async () => {
    const vault = await Vault.open(await teamVault());
    const result = await callTool(vaultIndexTool, vault, {});
    expect(result.total).toBe(5);
    expect(result.notes.map((n) => n.path)).not.toContain("private/Salaries.md");
    expect(result.notes.map((n) => n.path)).not.toContain("templates/Daily.md");
    expect(result.notes.find((n) => n.path === "people/Ana.md")).toEqual({
      path: "people/Ana.md",
      title: "Ana",
      type: "person",
      summary: "Product lead, owns the launch",
    });
  });

  it("filters by type and folder, and paginates", async () => {
    const vault = await Vault.open(await teamVault());
    expect((await callTool(vaultIndexTool, vault, { type: "project" })).total).toBe(2);
    expect(
      (await callTool(vaultIndexTool, vault, { folder: "people/" })).notes.map((n) => n.path),
    ).toEqual(["people/Ana.md"]);
    const page = await callTool(vaultIndexTool, vault, { limit: 2, offset: 2 });
    expect(page.notes).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe("note_search", () => {
  it("ranks title and summary matches above body matches", async () => {
    const vault = await Vault.open(await teamVault());
    const paths = (await callTool(noteSearchTool, vault, { query: "launch" })).results.map(
      (r) => r.path,
    );
    expect(paths[0]).toBe("projects/Launch Plan.md");
    expect(paths).toContain("wiki/Café Notes.md");
  });

  it("ignores case and accents", async () => {
    const vault = await Vault.open(await teamVault());
    expect((await callTool(noteSearchTool, vault, { query: "CAFE" })).results[0]?.path).toBe(
      "wiki/Café Notes.md",
    );
  });

  it("returns a snippet from the matching line", async () => {
    const vault = await Vault.open(await teamVault());
    const hit = (await callTool(noteSearchTool, vault, { query: "payment provider" })).results[0];
    expect(hit?.path).toBe("projects/Launch Plan.md");
    expect(hit?.snippet).toBe("Payment provider approval may slip.");
  });

  it("prefers notes that match every term", async () => {
    const vault = await Vault.open(await teamVault());
    const results = (await callTool(noteSearchTool, vault, { query: "pricing tiers" })).results;
    expect(results[0]?.path).toBe("projects/Pricing.md");
  });

  it("never returns blocked or ignored notes", async () => {
    const vault = await Vault.open(await teamVault());
    const { results } = await callTool(noteSearchTool, vault, {
      query: "bonus salaries template",
    });
    const paths = results.map((r) => r.path);
    expect(paths).toEqual([]);
  });

  it("prefers a text line over a heading for the snippet", async () => {
    const vault = await Vault.open(await teamVault());
    const hit = (await callTool(noteSearchTool, vault, { query: "launch", type: "person" }))
      .results[0];
    expect(hit?.snippet).toBe("Leads the [[Launch Plan]]. Prefers written updates.");
  });

  it("applies filters and limit", async () => {
    const vault = await Vault.open(await teamVault());
    expect((await callTool(noteSearchTool, vault, { query: "launch", type: "person" })).total).toBe(
      1,
    );
    expect(
      (await callTool(noteSearchTool, vault, { query: "launch", limit: 1 })).results,
    ).toHaveLength(1);
  });
});

describe("note_read", () => {
  it("reads by wikilink name", async () => {
    const vault = await Vault.open(await teamVault());
    const result = await callTool(noteReadTool, vault, { ref: "Ana" });
    expect(result.path).toBe("people/Ana.md");
    expect(result.frontmatter).toMatchObject({ type: "person" });
    expect(result.content).toContain("Prefers written updates.");
    expect(result.truncated).toBe(false);
  });

  it("returns a section with its subsections", async () => {
    const vault = await Vault.open(await teamVault());
    const result = await callTool(noteReadTool, vault, { ref: "Launch Plan", section: "Risks" });
    expect(result.content).toBe(
      "## Risks\n\nPayment provider approval may slip.\n\n### Mitigation\n\nApply early.",
    );
  });

  it("accepts the section in the reference, like a wikilink", async () => {
    const vault = await Vault.open(await teamVault());
    expect((await callTool(noteReadTool, vault, { ref: "Pricing#Tiers" })).content).toContain(
      "Free and Pro.",
    );
  });

  it("truncates long notes", async () => {
    const vault = await Vault.open(
      await createVault({ "Long.md": `# Long\n\n${"word ".repeat(400)}` }),
    );
    const result = await callTool(noteReadTool, vault, { ref: "Long", maxChars: 500 });
    expect(result.truncated).toBe(true);
    expect(result.content).toHaveLength(500);
    expect((await callTool(noteReadTool, vault, { ref: "Long" })).truncated).toBe(false);
  });

  it("reports missing sections and hides blocked notes", async () => {
    const vault = await Vault.open(await teamVault());
    await expect(
      callTool(noteReadTool, vault, { ref: "Ana", section: "Nope" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callTool(noteReadTool, vault, { ref: "private/Salaries.md" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("extractSection", () => {
  it("ignores headings inside code fences", () => {
    const body = "## A\n```\n## B\n```\ntext\n## C\nother";
    expect(extractSection(body, "A")).toBe("## A\n```\n## B\n```\ntext");
  });
});

describe("note_links", () => {
  it("resolves outgoing links and lists backlinks", async () => {
    const vault = await Vault.open(await teamVault());
    const result = await callTool(noteLinksTool, vault, { ref: "Launch Plan" });
    expect(result.outgoing).toEqual([
      {
        target: "Ana",
        heading: null,
        embed: false,
        line: 8,
        status: "found",
        path: "people/Ana.md",
      },
      {
        target: "Pricing",
        heading: "Tiers",
        embed: false,
        line: 8,
        status: "found",
        path: "projects/Pricing.md",
      },
      {
        target: "Missing Note",
        heading: null,
        embed: false,
        line: 8,
        status: "missing",
        path: null,
      },
    ]);
    expect(result.backlinks.map((b) => b.path)).toEqual(["people/Ana.md", "projects/Pricing.md"]);
  });
});

describe("note_links with ambiguous targets", () => {
  it("lists the candidates", async () => {
    const vault = await Vault.open(
      await createVault({
        "A.md": "# A\n\n[[Dup]]",
        "x/Dup.md": "# Dup",
        "y/Dup.md": "# Dup",
      }),
    );
    const result = await callTool(noteLinksTool, vault, { ref: "A" });
    expect(result.outgoing[0]).toMatchObject({
      status: "ambiguous",
      path: null,
      candidates: ["x/Dup.md", "y/Dup.md"],
    });
  });
});
