import { fileName, withoutMarkdownExtension } from "../core/files.js";

/** How a wikilink target resolves: to one file, to none, or to several candidates. */
export type Resolution =
  | { status: "found"; path: string }
  | { status: "missing" }
  | { status: "ambiguous"; candidates: string[] };

const MISSING: Resolution = { status: "missing" };

function key(file: string): string {
  return withoutMarkdownExtension(file).toLowerCase();
}

function fromCandidates(candidates: readonly string[]): Resolution {
  const [first] = candidates;
  if (candidates.length === 1 && first !== undefined) return { status: "found", path: first };
  if (candidates.length > 1) return { status: "ambiguous", candidates: [...candidates].sort() };
  return MISSING;
}

export class LinkResolver {
  private readonly byKey = new Map<string, string>();
  private readonly byName = new Map<string, string[]>();

  constructor(files: readonly string[]) {
    for (const file of files) {
      const fileKey = key(file);
      const name = fileName(fileKey);
      this.byKey.set(fileKey, file);
      this.byName.set(name, [...(this.byName.get(name) ?? []), file]);
    }
  }

  resolve(target: string): Resolution {
    const cleaned = (target.split("#")[0] ?? "")
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\.?\//, "");
    if (cleaned === "") return MISSING;
    const wanted = key(cleaned);

    const exact = this.byKey.get(wanted);
    if (exact !== undefined) return { status: "found", path: exact };
    if (!wanted.includes("/")) return fromCandidates(this.byName.get(wanted) ?? []);

    const suffix = `/${wanted}`;
    const matches = [...this.byKey].filter(([candidate]) => candidate.endsWith(suffix));
    return fromCandidates(matches.map(([, file]) => file));
  }
}
