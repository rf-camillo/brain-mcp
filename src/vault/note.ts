import { type Frontmatter, parseNote } from "../markdown/frontmatter.js";
import { titleOf } from "../markdown/title.js";
import { extractLinks, type WikiLink } from "../markdown/wikilinks.js";

/** A Markdown file of the vault, parsed once and cached until the file changes. */
export interface Note {
  path: string;
  title: string;
  frontmatter: Frontmatter | null;
  frontmatterError: string | null;
  body: string;
  bodyLine: number;
  links: WikiLink[];
  ignored: boolean;
}

export function createNote(path: string, text: string, ignored: boolean): Note {
  const parsed = parseNote(text);
  return {
    path,
    title: titleOf(path, parsed.body),
    frontmatter: parsed.frontmatter,
    frontmatterError: parsed.frontmatterError,
    body: parsed.body,
    bodyLine: parsed.bodyLine,
    links: extractLinks(parsed.body, parsed.bodyLine),
    ignored,
  };
}

export function frontmatterString(note: Note, key: string): string | null {
  const value = note.frontmatter?.[key];
  if (value === undefined || value === null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}
