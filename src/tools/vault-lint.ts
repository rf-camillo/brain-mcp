import { z } from "zod";

import { runLint } from "../features/lint/run-lint.js";
import { ISSUE_KINDS } from "../features/lint/types.js";
import { defineTool } from "./define-tool.js";

const issueKind = z.enum(ISSUE_KINDS);

export const vaultLintTool = defineTool({
  name: "vault_lint",
  title: "Check vault health",
  description:
    "Check the health of the vault: invalid or missing frontmatter, missing required fields, broken and ambiguous links, orphan notes, notes missing from the index, and content that looks like a secret or personal identifier.",
  access: "read",
  input: z.object({
    kinds: z.array(issueKind).optional().describe("Only report these kinds of issue"),
    folder: z.string().min(1).optional().describe("Only check notes under this folder"),
  }),
  output: z.object({
    checked: z.number(),
    total: z.number(),
    counts: z.partialRecord(issueKind, z.number()),
    issues: z.array(
      z.object({
        kind: issueKind,
        path: z.string(),
        line: z.number().optional(),
        detail: z.string(),
      }),
    ),
  }),
  run(vault, { kinds, folder }, { now }) {
    return runLint(vault, { kinds, folder, now });
  },
});
