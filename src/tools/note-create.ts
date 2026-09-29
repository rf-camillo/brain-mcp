import { z } from "zod";

import { createNote } from "../features/notes/create-note.js";
import { defineTool } from "./define-tool.js";

const scalar = z.union([z.string(), z.number(), z.boolean()]);

export const noteCreateTool = defineTool({
  name: "note_create",
  title: "Create a note",
  description:
    "Create a new note with frontmatter. Only works inside the folders the vault allows for writing, never overwrites an existing note, and refuses content that looks like a secret or personal identifier. Returns warnings for broken links and name clashes.",
  access: "write",
  input: z.object({
    path: z
      .string()
      .trim()
      .min(1)
      .describe('Where to create the note, for example "inbox/Idea.md". ".md" is added if missing'),
    frontmatter: z
      .record(z.string().min(1), z.union([scalar, z.array(scalar)]))
      .describe("Frontmatter fields; the vault's required fields must be present"),
    body: z.string().max(200_000).default("").describe("Markdown body"),
  }),
  output: z.object({ path: z.string(), title: z.string(), warnings: z.array(z.string()) }),
  run(vault, args) {
    return createNote(vault, args);
  },
});
