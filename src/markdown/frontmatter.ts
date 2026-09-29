import { parse, stringify } from "yaml";

import { errorMessage } from "../core/errors.js";

export type Frontmatter = Record<string, unknown>;

export interface ParsedNote {
  frontmatter: Frontmatter | null;
  frontmatterError: string | null;
  body: string;
  bodyLine: number;
}

const OPENING = /^---\r?\n/;
const CLOSING = /^---[ \t]*$/m;

function parseYaml(raw: string): Pick<ParsedNote, "frontmatter" | "frontmatterError"> {
  let data: unknown;
  try {
    data = parse(raw, { logLevel: "error" });
  } catch (error) {
    return { frontmatter: null, frontmatterError: errorMessage(error) };
  }
  if (data === null || data === undefined) return { frontmatter: {}, frontmatterError: null };
  if (typeof data !== "object" || Array.isArray(data)) {
    return { frontmatter: null, frontmatterError: "Frontmatter is not a key-value map" };
  }
  return { frontmatter: data as Frontmatter, frontmatterError: null };
}

export function parseNote(text: string): ParsedNote {
  const withoutFrontmatter = { frontmatter: null, frontmatterError: null, body: text, bodyLine: 1 };
  const opening = OPENING.exec(text);
  if (!opening) return withoutFrontmatter;

  const rest = text.slice(opening[0].length);
  const closing = CLOSING.exec(rest);
  if (!closing) return withoutFrontmatter;

  const body = rest.slice(closing.index + closing[0].length).replace(/^\r?\n/, "");
  const bodyLine = text.slice(0, text.length - body.length).split("\n").length;
  return { ...parseYaml(rest.slice(0, closing.index)), body, bodyLine };
}

export function serializeNote(frontmatter: Frontmatter, body: string): string {
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  const content = body.replace(/^\n+/, "").trimEnd();
  return `---\n${yaml}\n---\n\n${content}\n`;
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function missingFields(frontmatter: Frontmatter, required: readonly string[]): string[] {
  return required.filter((key) => isBlank(frontmatter[key]));
}
