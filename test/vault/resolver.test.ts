import { describe, expect, it } from "vitest";

import { LinkResolver } from "../../src/vault/resolver.js";

const resolver = new LinkResolver([
  "projects/Launch Plan.md",
  "people/Ana.md",
  "archive/people/Ana.md",
  "team/people/Bo.md",
  "assets/diagram.png",
]);

describe("LinkResolver", () => {
  it("resolves exact paths, with or without the extension", () => {
    expect(resolver.resolve("people/Ana")).toEqual({ status: "found", path: "people/Ana.md" });
    expect(resolver.resolve("./people/Ana.md")).toEqual({ status: "found", path: "people/Ana.md" });
  });

  it("resolves unique names, ignoring case and headings", () => {
    expect(resolver.resolve("launch plan#Risks")).toEqual({
      status: "found",
      path: "projects/Launch Plan.md",
    });
    expect(resolver.resolve("diagram.png")).toEqual({
      status: "found",
      path: "assets/diagram.png",
    });
  });

  it("resolves unique path suffixes", () => {
    expect(resolver.resolve("people/Bo")).toEqual({ status: "found", path: "team/people/Bo.md" });
  });

  it("reports ambiguity with sorted candidates", () => {
    expect(resolver.resolve("Ana")).toEqual({
      status: "ambiguous",
      candidates: ["archive/people/Ana.md", "people/Ana.md"],
    });
  });

  it("reports missing targets", () => {
    expect(resolver.resolve("Nobody")).toEqual({ status: "missing" });
    expect(resolver.resolve("  ")).toEqual({ status: "missing" });
    expect(resolver.resolve("#Only a heading")).toEqual({ status: "missing" });
  });
});
