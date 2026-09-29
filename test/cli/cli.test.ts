import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { USAGE } from "../../src/cli/options.js";
import { runCli as main } from "../../src/cli/run.js";
import { teamVault } from "../support/fixtures.js";
import { createVault, note } from "../support/helpers.js";

async function run(root: string, ...args: string[]) {
  const result = await main(["--vault", root, ...args], {});
  return { code: result.code, json: JSON.parse(result.output) as Record<string, unknown> };
}

describe("cli", () => {
  it("prints usage without a command", async () => {
    expect(await main([], {})).toEqual({ code: 2, output: USAGE });
    expect(await main(["--help"], {})).toEqual({ code: 0, output: USAGE });
  });

  it("reports unknown options and commands", async () => {
    expect((await main(["--nope"], {})).code).toBe(2);
    const root = await teamVault();
    const result = await run(root, "fly");
    expect(result.code).toBe(1);
    expect(result.json).toMatchObject({ error: "INVALID_INPUT" });
  });

  it("runs the read commands", async () => {
    const root = await teamVault();
    expect((await run(root, "index", "--type", "project")).json).toMatchObject({ total: 2 });
    expect((await run(root, "search", "payment", "provider")).json).toMatchObject({
      results: [{ path: "projects/Launch Plan.md" }],
    });
    expect((await run(root, "read", "Launch Plan", "--section", "Timeline")).json).toMatchObject({
      content: "## Timeline\n\nMarch.",
    });
    expect((await run(root, "links", "Ana")).json).toMatchObject({ path: "people/Ana.md" });
  });

  it("uses BRAIN_VAULT when --vault is missing", async () => {
    const root = await teamVault();
    const result = await main(["index", "--limit", "1"], { BRAIN_VAULT: root });
    expect(JSON.parse(result.output)).toMatchObject({ total: 5 });
  });

  it("exits with 1 when lint finds issues", async () => {
    const clean = await createVault({ "A.md": note({ type: "x", summary: "y" }, "# A") });
    expect((await run(clean, "lint", "--kind", "broken_link")).code).toBe(0);
    const root = await teamVault();
    const result = await run(root, "lint", "--kind", "broken_link");
    expect(result.code).toBe(1);
    expect(result.json).toMatchObject({ counts: { broken_link: 1 } });
  });

  it("runs the write commands", async () => {
    const root = await createVault({ "brain.config.yaml": "writable: [inbox/**, diary/**]\n" });
    const diary = await run(
      root,
      "diary",
      "Wrote",
      "the",
      "CLI",
      "--date",
      "2026-01-05",
      "--no-time",
    );
    expect(diary.json).toMatchObject({
      path: "diary/2026/2026-01-05.md",
      entry: "- Wrote the CLI",
    });

    const created = await run(
      root,
      "create",
      "inbox/Idea.md",
      "--frontmatter",
      '{"type":"idea","summary":"An idea"}',
      "--body",
      "Text",
    );
    expect(created).toMatchObject({ code: 0, json: { path: "inbox/Idea.md" } });

    expect((await run(root, "build-index")).json).toMatchObject({ written: true, notes: 2 });
    expect(await readFile(path.join(root, "index.md"), "utf8")).toContain("[[Idea]]");
  });

  it("validates inputs with readable errors", async () => {
    const root = await teamVault();
    expect((await run(root, "index", "--limit", "abc")).json).toMatchObject({
      error: "INVALID_INPUT",
      message: "--limit must be an integer",
    });
    expect((await run(root, "diary", "x", "--date", "tomorrow")).json).toMatchObject({
      error: "INVALID_INPUT",
    });
    expect((await run(root, "create", "inbox/a.md", "--frontmatter", "[1]")).json).toMatchObject({
      message: "--frontmatter must be a JSON object",
    });
  });

  it("honours --read-only", async () => {
    const root = await createVault({ "brain.config.yaml": "writable: [diary/**]\n" });
    expect((await run(root, "--read-only", "diary", "x")).json).toMatchObject({
      error: "READ_ONLY",
    });
  });
});
