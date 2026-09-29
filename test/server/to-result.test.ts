import { describe, expect, it } from "vitest";

import { VaultError } from "../../src/core/errors.js";
import { toFailure, toSuccess } from "../../src/server/to-result.js";

function text(result: ReturnType<typeof toFailure>): unknown {
  const [first] = result.content as { text: string }[];
  return JSON.parse(first?.text ?? "null");
}

describe("to-result", () => {
  it("returns structured content with a JSON copy", () => {
    const result = toSuccess({ total: 1 });
    expect(result.structuredContent).toEqual({ total: 1 });
    expect(text(result)).toEqual({ total: 1 });
  });

  it("keeps the code of vault errors", () => {
    expect(text(toFailure(new VaultError("NOT_FOUND", "gone")))).toEqual({
      error: "NOT_FOUND",
      message: "gone",
    });
  });

  it("reports anything else as internal", () => {
    expect(text(toFailure(new Error("boom")))).toEqual({ error: "INTERNAL", message: "boom" });
    expect(text(toFailure("plain"))).toEqual({ error: "INTERNAL", message: "plain" });
  });
});
