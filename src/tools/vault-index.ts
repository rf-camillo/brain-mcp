import { z } from "zod";

import { matchesFilters } from "../features/filters.js";
import { defineTool } from "./define-tool.js";
import { folderFilter, noteSummary, summarize, typeFilter } from "./schemas.js";

export const vaultIndexTool = defineTool({
  name: "vault_index",
  title: "List notes",
  description:
    "List the notes in the vault with their title, type and one-line summary. Start here: read the index to decide which notes are relevant before opening any of them.",
  access: "read",
  input: z.object({
    type: typeFilter,
    folder: folderFilter,
    limit: z.number().int().min(1).max(1000).default(200).describe("Maximum notes to return"),
    offset: z.number().int().min(0).default(0).describe("Notes to skip, for pagination"),
  }),
  output: z.object({ total: z.number(), offset: z.number(), notes: z.array(noteSummary) }),
  run(vault, { type, folder, limit, offset }) {
    const matching = vault.notes().filter((note) => matchesFilters(note, { type, folder }));
    return {
      total: matching.length,
      offset,
      notes: matching.slice(offset, offset + limit).map(summarize),
    };
  },
});
