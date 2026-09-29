import { fold } from "../../markdown/text.js";

const MAX_LENGTH = 200;
const LEAD = MAX_LENGTH / 4;

function contains(line: string, terms: readonly string[]): boolean {
  const folded = fold(line);
  return terms.some((term) => folded.includes(term));
}

function around(text: string, terms: readonly string[]): string {
  if (text.length <= MAX_LENGTH) return text;
  const folded = fold(text);
  const positions = terms.map((term) => folded.indexOf(term)).filter((index) => index >= 0);
  const start = Math.max(0, Math.min(...positions) - LEAD);
  const end = start + MAX_LENGTH;
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export function snippet(body: string, terms: readonly string[]): string | null {
  const matching = body.split("\n").filter((line) => contains(line, terms));
  const line = matching.find((candidate) => !/^\s*#/.test(candidate)) ?? matching[0];
  return line === undefined ? null : around(line.trim().replace(/\s+/g, " "), terms);
}
