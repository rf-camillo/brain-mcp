import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { mapWithLimit } from "../core/concurrency.js";
import { createNote, type Note } from "./note.js";

const MAX_OPEN_FILES = 32;

interface Entry {
  mtimeMs: number;
  size: number;
  note: Note;
}

export class NoteCache {
  private entries = new Map<string, Entry>();

  constructor(private readonly root: string) {}

  async load(files: readonly string[], isIgnored: (path: string) => boolean): Promise<Note[]> {
    const loaded = await mapWithLimit(files, MAX_OPEN_FILES, async (file) => {
      const absolute = path.join(this.root, ...file.split("/"));
      const { mtimeMs, size } = await stat(absolute);
      const cached = this.entries.get(file);
      const ignored = isIgnored(file);
      if (cached?.mtimeMs === mtimeMs && cached.size === size && cached.note.ignored === ignored) {
        return [file, cached] as const;
      }
      const note = createNote(file, await readFile(absolute, "utf8"), ignored);
      return [file, { mtimeMs, size, note }] as const;
    });
    this.entries = new Map(loaded);
    return loaded.map(([, entry]) => entry.note);
  }
}
