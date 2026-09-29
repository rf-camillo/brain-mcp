import { linesOutsideCode } from "./code-fences.js";

export interface WikiLink {
  target: string;
  heading: string | null;
  alias: string | null;
  embed: boolean;
  line: number;
}

const WIKILINK = /(!?)\[\[([^\]\n]+)\]\]/g;
const INLINE_CODE = /`[^`\n]*`/g;

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseLink(embed: boolean, inner: string, line: number): WikiLink {
  const [rawTarget = "", ...aliasParts] = inner.split("|");
  const target = rawTarget.replace(/\\$/, "");
  const hash = target.indexOf("#");
  return {
    target: (hash >= 0 ? target.slice(0, hash) : target).trim(),
    heading: hash >= 0 ? emptyToNull(target.slice(hash + 1)) : null,
    alias: aliasParts.length > 0 ? emptyToNull(aliasParts.join("|")) : null,
    embed,
    line,
  };
}

export function extractLinks(body: string, firstLine = 1): WikiLink[] {
  const links: WikiLink[] = [];
  for (const [index, line] of linesOutsideCode(body)) {
    for (const match of line.replace(INLINE_CODE, "").matchAll(WIKILINK)) {
      links.push(parseLink(match[1] === "!", match[2] ?? "", index + firstLine));
    }
  }
  return links;
}
