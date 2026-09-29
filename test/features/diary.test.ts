import { describe, expect, it } from "vitest";

import { diaryPath, diaryPathPattern } from "../../src/features/diary/diary-path.js";
import { insertEntry } from "../../src/features/diary/insert-entry.js";

describe("insertEntry", () => {
  const order = ["Product", "Engineering", "Decisions"];

  it("appends without a section", () => {
    expect(insertEntry("# Day\n", "- a", null, order)).toBe("# Day\n\n- a\n");
  });

  it("matches sections written as wikilinks", () => {
    const text = "# Day\n\n## [[Product]]\n\n- a\n";
    expect(insertEntry(text, "- b", "Product", order)).toBe(
      "# Day\n\n## [[Product]]\n\n- a\n- b\n",
    );
  });

  it("adds an unknown section at the end", () => {
    expect(insertEntry("# Day\n\n## Product\n\n- a\n", "- b", "Other", order)).toBe(
      "# Day\n\n## Product\n\n- a\n\n## Other\n\n- b\n",
    );
  });
});

describe("diary paths", () => {
  it("fills and matches the pattern", () => {
    const pattern = "journal/{yyyy}/{mm}/{dd}.md";
    expect(diaryPath(pattern, "2026-09-29")).toBe("journal/2026/09/29.md");
    expect(diaryPathPattern(pattern).test("journal/2026/09/29.md")).toBe(true);
    expect(diaryPathPattern(pattern).test("journal/2026/9/29.md")).toBe(false);
  });
});
