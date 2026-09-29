import { describe, expect, it } from "vitest";

import { scoreNote } from "../../src/features/search/score.js";
import { snippet } from "../../src/features/search/snippet.js";
import { createNote } from "../../src/vault/note.js";

describe("snippet", () => {
  it("returns null when nothing matches", () => {
    expect(snippet("# Title\n\nNothing here.", ["launch"])).toBeNull();
  });

  it("falls back to a heading when it is the only match", () => {
    expect(snippet("# Launch\n\nOther text.", ["launch"])).toBe("# Launch");
  });

  it("cuts long lines around the first match", () => {
    const line = `${"alpha ".repeat(60)}launch ${"omega ".repeat(60)}`;
    const result = snippet(line, ["launch"]);
    expect(result).toMatch(/^….*launch.*…$/);
    expect(result?.length).toBeLessThanOrEqual(202);
  });

  it("keeps the start when the match is early", () => {
    const result = snippet(`launch ${"word ".repeat(80)}`, ["launch"]);
    expect(result?.startsWith("launch")).toBe(true);
    expect(result?.endsWith("…")).toBe(true);
  });
});

describe("scoreNote", () => {
  const note = createNote(
    "projects/Launch Plan.md",
    "---\nsummary: Plan for the launch\n---\n# Launch Plan\n\nlaunch launch launch",
    false,
  );

  it("scores zero without terms or matches", () => {
    expect(scoreNote(note, [], "")).toBe(0);
    expect(scoreNote(note, ["pricing"], "pricing")).toBe(0);
  });

  it("penalizes partial matches and rewards the whole phrase", () => {
    const partial = scoreNote(note, ["launch", "pricing"], "launch pricing");
    const full = scoreNote(note, ["launch", "plan"], "launch plan");
    expect(partial).toBeGreaterThan(0);
    expect(full).toBeGreaterThan(partial);
  });
});
