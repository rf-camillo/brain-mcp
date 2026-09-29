function sectionName(line: string): string | null {
  const name = /^##\s+(.+?)\s*$/.exec(line)?.[1];
  if (name === undefined) return null;
  return name
    .replace(/^\[\[(.+?)(\|.*)?\]\]$/, "$1")
    .trim()
    .toLowerCase();
}

function isBlankLine(line: string | undefined): boolean {
  return (line ?? "").trim() === "";
}

function appendToSection(lines: string[], start: number, entry: string): string[] {
  const next = lines.findIndex((line, index) => index > start && /^#{1,2}\s/.test(line));
  let insertAt = next < 0 ? lines.length : next;
  while (insertAt > start + 1 && isBlankLine(lines[insertAt - 1])) insertAt -= 1;

  const before = lines.slice(0, insertAt);
  if (insertAt === start + 1) before.push("");
  const after = lines.slice(insertAt);
  const spacer = after.length > 0 && !isBlankLine(after[0]) ? [""] : [];
  return [...before, entry, ...spacer, ...after];
}

function addSection(
  lines: string[],
  section: string,
  entry: string,
  order: readonly string[],
): string[] {
  const block = [`## ${section}`, "", entry];
  const rank = order.findIndex((name) => name.toLowerCase() === section.toLowerCase());
  const later = new Set(order.slice(rank + 1).map((name) => name.toLowerCase()));
  const next = rank < 0 ? -1 : lines.findIndex((line) => later.has(sectionName(line) ?? ""));
  if (next < 0) return [...lines, "", ...block];
  return [...lines.slice(0, next), ...block, "", ...lines.slice(next)];
}

export function insertEntry(
  text: string,
  entry: string,
  section: string | null,
  order: readonly string[],
): string {
  const lines = text.replace(/\s+$/, "").split("\n");
  if (section === null) return `${[...lines, "", entry].join("\n")}\n`;

  const start = lines.findIndex((line) => sectionName(line) === section.toLowerCase());
  const updated =
    start >= 0 ? appendToSection(lines, start, entry) : addSection(lines, section, entry, order);
  return `${updated.join("\n")}\n`;
}
