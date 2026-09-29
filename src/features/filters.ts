import { isUnderFolder } from "../core/files.js";
import { frontmatterString, type Note } from "../vault/note.js";

export interface NoteFilters {
  type?: string | undefined;
  folder?: string | undefined;
}

export function matchesFilters(note: Note, { type, folder }: NoteFilters): boolean {
  if (type !== undefined && frontmatterString(note, "type") !== type) return false;
  return folder === undefined || isUnderFolder(note.path, folder);
}
