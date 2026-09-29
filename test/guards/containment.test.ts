import { mkdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isInside, resolveInside } from "../../src/guards/containment.js";
import { tempDir } from "../support/helpers.js";

describe("isInside", () => {
  it("accepts the root and its descendants", () => {
    expect(isInside("/vault", "/vault")).toBe(true);
    expect(isInside("/vault", "/vault/a/b.md")).toBe(true);
  });

  it("accepts folders whose name starts with two dots", () => {
    expect(isInside("/vault", "/vault/..drafts/a.md")).toBe(true);
  });

  it("rejects parents and siblings", () => {
    expect(isInside("/vault", "/a.md")).toBe(false);
    expect(isInside("/vault", "/vault-2/a.md")).toBe(false);
  });
});

describe("resolveInside", () => {
  it("accepts existing and not-yet-created paths inside the vault", async () => {
    const root = await tempDir();
    await writeFile(path.join(root, "a.md"), "");
    await expect(resolveInside(root, "a.md")).resolves.toBe(path.join(root, "a.md"));
    await expect(resolveInside(root, "new/dir/b.md")).resolves.toBe(
      path.join(root, "new", "dir", "b.md"),
    );
  });

  it("rejects a symlink that points outside the vault", async () => {
    const root = await tempDir();
    const outside = await tempDir();
    await mkdir(path.join(outside, "target"));
    await symlink(path.join(outside, "target"), path.join(root, "escape"));
    await expect(resolveInside(root, "escape/new.md")).rejects.toMatchObject({
      code: "OUTSIDE_VAULT",
    });
  });
});
