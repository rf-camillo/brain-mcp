import { fold } from "../../markdown/text.js";
import { frontmatterString, type Note } from "../../vault/note.js";

const WEIGHTS = { title: 6, summary: 4, path: 2, body: 1 } as const;
const BODY_CAP = 5;

interface FoldedNote {
  title: string;
  summary: string;
  path: string;
  body: string;
}

const foldedNotes = new WeakMap<Note, FoldedNote>();

function folded(note: Note): FoldedNote {
  let cached = foldedNotes.get(note);
  if (!cached) {
    cached = {
      title: fold(note.title),
      summary: fold(frontmatterString(note, "summary") ?? ""),
      path: fold(note.path),
      body: fold(note.body),
    };
    foldedNotes.set(note, cached);
  }
  return cached;
}

function occurrences(haystack: string, needle: string, cap: number): number {
  let hits = 0;
  for (
    let at = haystack.indexOf(needle);
    at >= 0 && hits < cap;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    hits += 1;
  }
  return hits;
}

function termScore(fields: FoldedNote, term: string): number {
  return (
    occurrences(fields.title, term, 1) * WEIGHTS.title +
    occurrences(fields.summary, term, 1) * WEIGHTS.summary +
    occurrences(fields.path, term, 1) * WEIGHTS.path +
    occurrences(fields.body, term, BODY_CAP) * WEIGHTS.body
  );
}

export function scoreNote(note: Note, terms: readonly string[], phrase: string): number {
  if (terms.length === 0) return 0;
  const fields = folded(note);
  const scores = terms.map((term) => termScore(fields, term));
  const matched = scores.filter((score) => score > 0).length;
  if (matched === 0) return 0;

  const phraseBonus =
    terms.length > 1 && (fields.title.includes(phrase) || fields.summary.includes(phrase))
      ? WEIGHTS.title
      : 0;
  const total = scores.reduce((sum, score) => sum + score, 0) + phraseBonus;
  return Math.round(total * (matched / terms.length) * 100) / 100;
}
