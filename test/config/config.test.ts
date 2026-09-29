import { writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CONFIG_FILE, loadConfig, parseConfig } from "../../src/config/load.js";
import { tempDir } from "../support/helpers.js";

describe("config", () => {
  it("uses defaults when the file is missing", async () => {
    const config = await loadConfig(await tempDir());
    expect(config.frontmatter.required).toEqual(["summary", "type"]);
    expect(config.blocked).toEqual([]);
    expect(config.writable).toEqual(["diary/**", "inbox/**"]);
    expect(config.index.path).toBe("index.md");
    expect(config.diary.path).toBe("diary/{yyyy}/{yyyy}-{mm}-{dd}.md");
    expect(config.sensitive.builtin).toBe(true);
  });

  it("merges partial sections with defaults", () => {
    const config = parseConfig({ diary: { sections: ["Work"] }, blocked: ["private/**"] });
    expect(config.diary.sections).toEqual(["Work"]);
    expect(config.diary.path).toBe("diary/{yyyy}/{yyyy}-{mm}-{dd}.md");
    expect(config.blocked).toEqual(["private/**"]);
  });

  it("rejects unknown keys so typos do not silently disable a guard", () => {
    expect(() => parseConfig({ blocekd: ["private/**"] })).toThrow(
      expect.objectContaining({ code: "INVALID_CONFIG" }),
    );
  });

  it("rejects invalid sensitive patterns", () => {
    expect(() => parseConfig({ sensitive: { patterns: [{ name: "bad", pattern: "(" }] } })).toThrow(
      /sensitive pattern "bad"/,
    );
  });

  it("reports invalid YAML", async () => {
    const root = await tempDir();
    await writeFile(path.join(root, CONFIG_FILE), "blocked: [unclosed");
    await expect(loadConfig(root)).rejects.toMatchObject({ code: "INVALID_CONFIG" });
  });
});
