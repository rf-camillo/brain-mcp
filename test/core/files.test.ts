import { describe, expect, it } from "vitest";

import {
  fileName,
  isMarkdownFile,
  isUnderFolder,
  normalizeFolder,
  topFolder,
  withMarkdownExtension,
  withoutMarkdownExtension,
} from "../../src/core/files.js";

describe("files", () => {
  it("recognizes Markdown files in any case", () => {
    expect(isMarkdownFile("a/Note.MD")).toBe(true);
    expect(isMarkdownFile("a/image.png")).toBe(false);
  });

  it("adds and removes the extension", () => {
    expect(withMarkdownExtension("inbox/Idea")).toBe("inbox/Idea.md");
    expect(withMarkdownExtension("inbox/Idea.md")).toBe("inbox/Idea.md");
    expect(withoutMarkdownExtension("inbox/Idea.md")).toBe("inbox/Idea");
  });

  it("splits names and folders", () => {
    expect(fileName("a/b/C.md")).toBe("C.md");
    expect(topFolder("a/b/C.md")).toBe("a");
    expect(topFolder("C.md")).toBe("");
  });

  it("normalizes folders and checks containment", () => {
    expect(normalizeFolder("./people/")).toBe("people");
    expect(normalizeFolder("wiki\\people")).toBe("wiki/people");
    expect(isUnderFolder("people/Ana.md", "people/")).toBe(true);
    expect(isUnderFolder("peoples/Ana.md", "people")).toBe(false);
    expect(isUnderFolder("anything.md", "")).toBe(true);
  });
});
