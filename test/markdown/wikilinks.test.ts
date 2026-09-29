import { describe, expect, it } from "vitest";

import { extractLinks } from "../../src/markdown/wikilinks.js";

describe("extractLinks", () => {
  it("parses targets, headings, aliases and embeds", () => {
    const links = extractLinks("See [[Launch Plan#Risks|the risks]] and ![[diagram.png]].");
    expect(links).toEqual([
      { target: "Launch Plan", heading: "Risks", alias: "the risks", embed: false, line: 1 },
      { target: "diagram.png", heading: null, alias: null, embed: true, line: 1 },
    ]);
  });

  it("ignores links in fenced blocks and inline code", () => {
    const body = "[[Real]]\n```\n[[Fenced]]\n```\n`[[Inline]]` and ~~~ not a fence";
    expect(extractLinks(body).map((link) => link.target)).toEqual(["Real"]);
  });

  it("keeps a tilde fence open until the matching marker", () => {
    const body = "~~~\n```\n[[Hidden]]\n~~~\n[[Visible]]";
    expect(extractLinks(body).map((link) => link.target)).toEqual(["Visible"]);
  });

  it("handles escaped pipes inside tables", () => {
    const [link] = extractLinks("| [[Launch Plan\\|plan]] |");
    expect(link).toMatchObject({ target: "Launch Plan", alias: "plan" });
  });

  it("records the line number", () => {
    expect(extractLinks("a\nb\n[[C]]")[0]?.line).toBe(3);
    expect(extractLinks("[[C]]", 10)[0]?.line).toBe(10);
  });
});
