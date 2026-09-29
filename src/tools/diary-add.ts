import { z } from "zod";

import { addDiaryEntry } from "../features/diary/add-entry.js";
import { defineTool } from "./define-tool.js";

export const diaryAddTool = defineTool({
  name: "diary_add",
  title: "Log to the daily note",
  description:
    "Log one entry to the daily note, under the given section, creating the day's note from the template when needed. Use it for decisions, deliveries and new facts worth keeping, not for chatter.",
  access: "write",
  input: z.object({
    text: z.string().trim().min(1).max(2000).describe("The entry, one line"),
    section: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Section heading to log under, for example a project name or Decisions"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Day in YYYY-MM-DD, defaults to today"),
    time: z.boolean().default(true).describe("Prefix the entry with the current time"),
  }),
  output: z.object({
    path: z.string(),
    section: z.string().nullable(),
    entry: z.string(),
    created: z.boolean(),
  }),
  run(vault, { text, section, date, time }, { now }) {
    return addDiaryEntry(vault, { text, section, date, withTime: time, now });
  },
});
