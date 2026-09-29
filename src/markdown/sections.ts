import { linesOutsideCode } from "./code-fences.js";

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

function normalizeHeading(heading: string): string {
  return heading
    .replace(/^#+\s*/, "")
    .trim()
    .toLowerCase();
}

export function extractSection(body: string, heading: string): string | null {
  const wanted = normalizeHeading(heading);
  const lines = body.split("\n");
  let start: number | null = null;
  let level = 0;

  for (const [index, line] of linesOutsideCode(body)) {
    const match = HEADING.exec(line);
    if (!match) continue;
    const depth = match[1]?.length ?? 0;
    if (start === null) {
      if (normalizeHeading(match[2] ?? "") === wanted) {
        start = index;
        level = depth;
      }
    } else if (depth <= level) {
      return lines.slice(start, index).join("\n").trim();
    }
  }
  return start === null ? null : lines.slice(start).join("\n").trim();
}
