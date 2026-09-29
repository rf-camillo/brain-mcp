import { fileName, withoutMarkdownExtension } from "../core/files.js";

const FIRST_HEADING = /^#\s+(.+?)\s*#*\s*$/m;

export function titleOf(path: string, body: string): string {
  const heading = FIRST_HEADING.exec(body)?.[1];
  if (heading) return heading.replace(/[*_`]/g, "").trim();
  return withoutMarkdownExtension(fileName(path));
}

export function startsWithHeading(body: string): boolean {
  return /^\s*#\s+\S/.test(body);
}
