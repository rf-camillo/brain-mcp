import { z } from "zod";

import { VaultError } from "../core/errors.js";
import { extractSection } from "../markdown/sections.js";
import { defineTool } from "./define-tool.js";
import { noteRef } from "./schemas.js";

function splitReference(
  ref: string,
  section: string | undefined,
): [note: string, section?: string] {
  const hash = ref.indexOf("#");
  if (hash <= 0 || section !== undefined) return section === undefined ? [ref] : [ref, section];
  const fromRef = ref.slice(hash + 1).trim();
  return fromRef === "" ? [ref.slice(0, hash)] : [ref.slice(0, hash), fromRef];
}

export const noteReadTool = defineTool({
  name: "note_read",
  title: "Read a note",
  description:
    'Read one note. "ref" can be a path ("projects/Launch Plan.md") or a wikilink name ("Launch Plan"), resolved the way Obsidian does. Optionally return only one section by its heading, also written as "Launch Plan#Risks".',
  access: "read",
  input: z.object({
    ref: noteRef,
    section: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Heading of the section to return, without the # marks"),
    maxChars: z
      .number()
      .int()
      .min(500)
      .max(200_000)
      .default(20_000)
      .describe("Truncate the content after this many characters"),
  }),
  output: z.object({
    path: z.string(),
    title: z.string(),
    frontmatter: z.record(z.string(), z.unknown()).nullable(),
    frontmatterError: z.string().nullable(),
    section: z.string().nullable(),
    content: z.string(),
    truncated: z.boolean(),
  }),
  run(vault, { ref, section, maxChars }) {
    const [noteName, wanted] = splitReference(ref, section);
    const note = vault.getNote(noteName);
    const content = wanted === undefined ? note.body.trim() : extractSection(note.body, wanted);
    if (content === null)
      throw new VaultError("NOT_FOUND", `No section "${String(wanted)}" in ${note.path}`);
    return {
      path: note.path,
      title: note.title,
      frontmatter: note.frontmatter,
      frontmatterError: note.frontmatterError,
      section: wanted ?? null,
      content: content.slice(0, maxChars),
      truncated: content.length > maxChars,
    };
  },
});
