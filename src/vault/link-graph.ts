import type { WikiLink } from "../markdown/wikilinks.js";
import type { Note } from "./note.js";
import type { LinkResolver, Resolution } from "./resolver.js";

export interface ResolvedLink extends WikiLink {
  resolution: Resolution;
}

export class LinkGraph {
  private readonly outgoingByPath = new Map<string, ResolvedLink[]>();
  private readonly incomingByPath = new Map<string, Set<string>>();

  constructor(notes: readonly Note[], resolver: LinkResolver) {
    for (const note of notes) {
      const resolved = note.links.map((link) => ({
        ...link,
        resolution: resolver.resolve(link.target),
      }));
      this.outgoingByPath.set(note.path, resolved);
      for (const { resolution } of resolved) {
        if (resolution.status === "found" && resolution.path !== note.path) {
          this.addIncoming(resolution.path, note.path);
        }
      }
    }
  }

  private addIncoming(target: string, source: string): void {
    const sources = this.incomingByPath.get(target) ?? new Set<string>();
    sources.add(source);
    this.incomingByPath.set(target, sources);
  }

  outgoing(path: string): ResolvedLink[] {
    return this.outgoingByPath.get(path) ?? [];
  }

  linkedFrom(path: string): string[] {
    return [...(this.incomingByPath.get(path) ?? [])].sort((a, b) => a.localeCompare(b));
  }

  linkedTargets(path: string): Set<string> {
    return new Set(
      this.outgoing(path).flatMap(({ resolution }) =>
        resolution.status === "found" ? [resolution.path] : [],
      ),
    );
  }
}
