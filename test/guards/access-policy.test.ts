import { describe, expect, it } from "vitest";

import { parseConfig } from "../../src/config/load.js";
import { AccessPolicy } from "../../src/guards/access-policy.js";

const config = parseConfig({ blocked: ["private/**", "**/secret.md"], writable: ["inbox/**"] });

describe("AccessPolicy", () => {
  const policy = new AccessPolicy(config, { readOnly: false });

  it("hides blocked paths, dot folders and node_modules", () => {
    expect(policy.isHidden("private/a.md")).toBe(true);
    expect(policy.isHidden("private/deep/a.md")).toBe(true);
    expect(policy.isHidden("notes/secret.md")).toBe(true);
    expect(policy.isHidden(".obsidian/app.json")).toBe(true);
    expect(policy.isHidden("node_modules/x/readme.md")).toBe(true);
    expect(policy.isHidden("notes/a.md")).toBe(false);
  });

  it("reports blocked notes as missing instead of revealing them", () => {
    expect(() => policy.assertReadable("private/a.md")).toThrow(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
  });

  it("allows writes only to writable paths and the index", () => {
    expect(() => policy.assertWritable("inbox/idea.md")).not.toThrow();
    expect(() => policy.assertWritable("index.md")).not.toThrow();
    expect(() => policy.assertWritable("notes/a.md")).toThrow(
      expect.objectContaining({ code: "NOT_WRITABLE" }),
    );
    expect(() => policy.assertWritable("brain.config.yaml")).toThrow(
      expect.objectContaining({ code: "NOT_WRITABLE" }),
    );
  });

  it("never writes to blocked paths, even if they match writable", () => {
    const loose = new AccessPolicy(parseConfig({ blocked: ["inbox/private/**"] }), {
      readOnly: false,
    });
    expect(() => loose.assertWritable("inbox/private/a.md")).toThrow(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
  });

  it("refuses every write in read-only mode", () => {
    const readOnly = new AccessPolicy(config, { readOnly: true });
    expect(() => readOnly.assertWritable("inbox/idea.md")).toThrow(
      expect.objectContaining({ code: "READ_ONLY" }),
    );
  });
});
