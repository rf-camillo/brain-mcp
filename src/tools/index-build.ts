import { z } from "zod";

import { buildCatalog } from "../features/catalog/build-catalog.js";
import { defineTool } from "./define-tool.js";

export const indexBuildTool = defineTool({
  name: "index_build",
  title: "Rebuild the index",
  description:
    "Rebuild the vault index: one line per note with a wikilink and its summary, grouped by top-level folder. Run it after adding or renaming notes so vault_index and human readers stay in sync.",
  access: "write",
  idempotent: true,
  input: z.object({
    dryRun: z.boolean().default(false).describe("Return the index without writing it"),
  }),
  output: z.object({
    path: z.string(),
    notes: z.number(),
    written: z.boolean(),
    content: z.string().optional(),
  }),
  run(vault, { dryRun }) {
    return buildCatalog(vault, { dryRun });
  },
});
