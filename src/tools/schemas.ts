import { z } from "zod";

import { frontmatterString, type Note } from "../vault/note.js";

export const typeFilter = z
  .string()
  .min(1)
  .optional()
  .describe('Only notes whose frontmatter "type" equals this value');

export const folderFilter = z
  .string()
  .min(1)
  .optional()
  .describe('Only notes under this folder, for example "projects" or "wiki/people"');

export const noteRef = z.string().trim().min(1).describe("Note path or wikilink name");

export const noteSummary = z.object({
  path: z.string(),
  title: z.string(),
  type: z.string().nullable(),
  summary: z.string().nullable(),
});

export function summarize(note: Note): z.output<typeof noteSummary> {
  return {
    path: note.path,
    title: note.title,
    type: frontmatterString(note, "type"),
    summary: frontmatterString(note, "summary"),
  };
}
