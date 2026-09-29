import { describe, expect, it } from "vitest";

import { LinkGraph } from "../../src/vault/link-graph.js";
import { createNote } from "../../src/vault/note.js";
import { LinkResolver } from "../../src/vault/resolver.js";

const notes = [
  createNote("A.md", "# A\n\n[[B]] [[B#Part]] [[Ghost]] [[A]]", false),
  createNote("B.md", "# B\n\n[[C]]", false),
  createNote("C.md", "# C", false),
  createNote("templates/T.md", "[[C]]", true),
];
const graph = new LinkGraph(notes, new LinkResolver(notes.map((note) => note.path)));

describe("LinkGraph", () => {
  it("keeps every outgoing link with its resolution", () => {
    expect(graph.outgoing("A.md").map((link) => [link.target, link.resolution.status])).toEqual([
      ["B", "found"],
      ["B", "found"],
      ["Ghost", "missing"],
      ["A", "found"],
    ]);
  });

  it("lists each source once, excluding self-links", () => {
    expect(graph.linkedFrom("B.md")).toEqual(["A.md"]);
    expect(graph.linkedFrom("A.md")).toEqual([]);
    expect(graph.linkedFrom("C.md")).toEqual(["B.md", "templates/T.md"]);
  });

  it("returns the resolved targets of a note", () => {
    expect([...graph.linkedTargets("A.md")].sort()).toEqual(["A.md", "B.md"]);
  });

  it("answers for unknown notes", () => {
    expect(graph.outgoing("Z.md")).toEqual([]);
    expect(graph.linkedFrom("Z.md")).toEqual([]);
  });
});
