import { describe, expect, it } from "vitest";

import { SensitiveScanner } from "../../src/guards/sensitive/scanner.js";

const builtin = new SensitiveScanner({ builtin: true, patterns: [] });

describe("SensitiveScanner", () => {
  it.each([
    ["-----BEGIN RSA PRIVATE KEY-----", "private key"],
    ["key AKIAABCDEFGHIJKLMNOP here", "AWS access key"],
    [`token ghp_${"a".repeat(36)}`, "GitHub token"],
    [`OPENAI=sk-${"x".repeat(32)}`, "API secret key"],
    ["xoxb-1234567890-abcdef", "Slack token"],
    ["SSN 123-45-6789", "US social security number"],
    ["CPF 123.456.789-09", "Brazilian CPF"],
    ["card 4111 1111 1111 1111", "payment card number"],
  ])("detects %s", (text, name) => {
    expect(builtin.scan(text)).toEqual([{ name, line: 1 }]);
  });

  it("ignores long numbers that fail the Luhn check", () => {
    expect(builtin.scan("order 4111 1111 1111 1112")).toEqual([]);
  });

  it("does not flag ordinary notes", () => {
    expect(builtin.scan("Met Ana on 2026-09-28 to plan the launch. Budget: 12,500.")).toEqual([]);
  });

  it("reports the line of each match", () => {
    expect(builtin.scan("fine\nSSN 123-45-6789")).toEqual([
      { name: "US social security number", line: 2 },
    ]);
  });

  it("supports custom patterns and can disable the built-in ones", () => {
    const scanner = new SensitiveScanner({
      builtin: false,
      patterns: [{ name: "internal code", pattern: "PROJECT-\\d+", flags: "i" }],
    });
    expect(scanner.scan("project-42")).toEqual([{ name: "internal code", line: 1 }]);
    expect(scanner.scan("SSN 123-45-6789")).toEqual([]);
  });

  it("does not mistake Luhn-valid timestamps for card numbers", () => {
    for (const value of ["1727600000001", "1727600000019", "1727600000027"]) {
      expect(builtin.scan(`at ${value}`)).toEqual([]);
    }
  });

  it("requires consistent separators in card numbers", () => {
    expect(builtin.scan("card 4111-1111-1111-1111")).toHaveLength(1);
    expect(builtin.scan("card 5500 0000 0000 0004")).toHaveLength(1);
    expect(builtin.scan("ref 4111-1111 1111-1111")).toEqual([]);
  });
});
