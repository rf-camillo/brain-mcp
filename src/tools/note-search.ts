import { z } from "zod";

import { searchNotes } from "../features/search/search-notes.js";
import { defineTool } from "./define-tool.js";
import { folderFilter, noteSummary, summarize, typeFilter } from "./schemas.js";

export const noteSearchTool = defineTool({
  name: "note_search",
  title: "Search notes",
  description:
    "Search notes by title, summary, path and text. Matches in the title and summary rank above matches in the body. Case and accents are ignored. Returns a snippet from the body when the text matches.",
  access: "read",
  input: z.object({
    query: z.string().trim().min(1).describe("Words to look for"),
    type: typeFilter,
    folder: folderFilter,
    limit: z.number().int().min(1).max(100).default(10).describe("Maximum results"),
  }),
  output: z.object({
    total: z.number(),
    results: z.array(noteSummary.extend({ score: z.number(), snippet: z.string().nullable() })),
  }),
  run(vault, { query, type, folder, limit }) {
    const hits = searchNotes(vault, query, { type, folder });
    return {
      total: hits.length,
      results: hits
        .slice(0, limit)
        .map(({ note, score, snippet }) => ({ ...summarize(note), score, snippet })),
    };
  },
});
