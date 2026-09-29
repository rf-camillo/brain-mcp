import { fold, words } from "../../markdown/text.js";
import type { Note } from "../../vault/note.js";
import type { Vault } from "../../vault/vault.js";
import { matchesFilters, type NoteFilters } from "../filters.js";
import { scoreNote } from "./score.js";
import { snippet } from "./snippet.js";

export interface SearchHit {
  note: Note;
  score: number;
  snippet: string | null;
}

export function searchNotes(vault: Vault, query: string, filters: NoteFilters): SearchHit[] {
  const terms = words(query);
  const phrase = fold(query);
  return vault
    .notes()
    .filter((note) => matchesFilters(note, filters))
    .map((note) => ({ note, score: scoreNote(note, terms, phrase) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.note.path.localeCompare(b.note.path))
    .map((hit) => ({ ...hit, snippet: snippet(hit.note.body, terms) }));
}
