import { describe, expect, it } from "vitest";

import { toVaultPath } from "../../src/guards/vault-path.js";

describe("toVaultPath", () => {
  it("normalizes separators and dot segments", () => {
    expect(toVaultPath("notes\\a.md")).toBe("notes/a.md");
    expect(toVaultPath("./notes/../notes/a.md")).toBe("notes/a.md");
    expect(toVaultPath("notes/")).toBe("notes");
    expect(toVaultPath("..drafts/a.md")).toBe("..drafts/a.md");
  });

  it.each(["../outside.md", "notes/../../outside.md", "/etc/passwd", "C:/Windows/win.ini"])(
    "rejects %s as outside the vault",
    (input) => {
      expect(() => toVaultPath(input)).toThrow(expect.objectContaining({ code: "OUTSIDE_VAULT" }));
    },
  );

  it.each(["", "   ", ".", "a\0b.md"])("rejects %j as invalid", (input) => {
    expect(() => toVaultPath(input)).toThrow(expect.objectContaining({ code: "INVALID_PATH" }));
  });
});
