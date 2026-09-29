import { describe, expect, it } from "vitest";

import { missingFields, parseNote, serializeNote } from "../../src/markdown/frontmatter.js";
import { startsWithHeading, titleOf } from "../../src/markdown/title.js";

describe("parseNote", () => {
  it("splits frontmatter from the body", () => {
    const parsed = parseNote("---\ntype: project\nsummary: A note\n---\n\n# Title\n\nText");
    expect(parsed.frontmatter).toEqual({ type: "project", summary: "A note" });
    expect(parsed.frontmatterError).toBeNull();
    expect(parsed.body).toBe("\n# Title\n\nText");
    expect(parsed.bodyLine).toBe(5);
  });

  it("handles Windows line endings", () => {
    const parsed = parseNote("---\r\ntype: a\r\n---\r\nBody");
    expect(parsed.frontmatter).toEqual({ type: "a" });
    expect(parsed.body).toBe("Body");
  });

  it("returns null frontmatter when there is none", () => {
    expect(parseNote("# Just a note").frontmatter).toBeNull();
    expect(parseNote("---\nnot closed").frontmatter).toBeNull();
  });

  it("treats an empty block as empty frontmatter", () => {
    expect(parseNote("---\n---\nBody").frontmatter).toEqual({});
  });

  it("reports invalid YAML and non-map frontmatter", () => {
    expect(parseNote("---\nkey: [unclosed\n---\n").frontmatterError).toBeTruthy();
    expect(parseNote("---\n- a\n- b\n---\n").frontmatterError).toMatch(/key-value/);
  });
});

describe("serializeNote", () => {
  it("round-trips through parseNote", () => {
    const text = serializeNote({ type: "idea", summary: "Colons: fine" }, "# Idea\n\nBody");
    const parsed = parseNote(text);
    expect(parsed.frontmatter).toEqual({ type: "idea", summary: "Colons: fine" });
    expect(parsed.body.trim()).toBe("# Idea\n\nBody");
  });
});

describe("titleOf", () => {
  it("prefers the first heading, without markup", () => {
    expect(titleOf("a/b.md", "Intro\n# **Big** `Title`\n# Second")).toBe("Big Title");
  });

  it("falls back to the file name", () => {
    expect(titleOf("projects/Launch Plan.md", "No heading")).toBe("Launch Plan");
  });
});

describe("missingFields", () => {
  it("treats null, blank strings and empty lists as missing", () => {
    expect(
      missingFields({ a: null, b: "  ", c: [], d: "x", e: 0, f: false }, [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
      ]),
    ).toEqual(["a", "b", "c", "g"]);
  });
});

describe("startsWithHeading", () => {
  it("detects a leading H1", () => {
    expect(startsWithHeading("\n# Title")).toBe(true);
    expect(startsWithHeading("Text\n# Title")).toBe(false);
    expect(startsWithHeading("## Sub")).toBe(false);
  });
});
