import { z } from "zod";

import type { ResolvedLink } from "../vault/link-graph.js";
import { defineTool } from "./define-tool.js";
import { noteRef } from "./schemas.js";

const outgoingLink = z.object({
  target: z.string(),
  heading: z.string().nullable(),
  embed: z.boolean(),
  line: z.number(),
  status: z.enum(["found", "missing", "ambiguous"]),
  path: z.string().nullable(),
  candidates: z.array(z.string()).optional(),
});

function describeLink({
  target,
  heading,
  embed,
  line,
  resolution,
}: ResolvedLink): z.output<typeof outgoingLink> {
  const base = { target, heading, embed, line };
  if (resolution.status === "found") return { ...base, status: "found", path: resolution.path };
  if (resolution.status === "ambiguous") {
    return { ...base, status: "ambiguous", path: null, candidates: resolution.candidates };
  }
  return { ...base, status: "missing", path: null };
}

export const noteLinksTool = defineTool({
  name: "note_links",
  title: "Show links",
  description:
    "Show how a note connects to the rest of the vault: the links it makes (resolved, missing or ambiguous) and the notes that link back to it.",
  access: "read",
  input: z.object({ ref: noteRef }),
  output: z.object({
    path: z.string(),
    title: z.string(),
    outgoing: z.array(outgoingLink),
    backlinks: z.array(z.object({ path: z.string(), title: z.string() })),
  }),
  run(vault, { ref }) {
    const note = vault.getNote(ref);
    return {
      path: note.path,
      title: note.title,
      outgoing: vault.graph.outgoing(note.path).map(describeLink),
      backlinks: vault.backlinks(note.path).map(({ path, title }) => ({ path, title })),
    };
  },
});
