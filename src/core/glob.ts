const REGEX_SPECIAL = /[.+^${}()|[\]\\]/g;

function translate(glob: string, index: number): [source: string, consumed: number] {
  const char = glob.charAt(index);
  if (char === "?") return ["[^/]", 1];
  if (char !== "*") return [char.replace(REGEX_SPECIAL, "\\$&"), 1];
  if (glob.charAt(index + 1) !== "*") return ["[^/]*", 1];

  const atSegmentStart = index === 0 || glob.charAt(index - 1) === "/";
  if (atSegmentStart && glob.charAt(index + 2) === "/") return ["(?:.*/)?", 3];
  return [".*", 2];
}

export function globToRegExp(glob: string): RegExp {
  let source = "";
  for (let index = 0; index < glob.length;) {
    const [piece, consumed] = translate(glob, index);
    source += piece;
    index += consumed;
  }
  return new RegExp(`^${source}$`);
}

export class GlobSet {
  private readonly patterns: readonly RegExp[];

  constructor(globs: readonly string[]) {
    this.patterns = globs.map(globToRegExp);
  }

  matches(path: string): boolean {
    return this.patterns.some((pattern) => pattern.test(path));
  }

  matchesDirectory(dir: string): boolean {
    return this.matches(dir) || this.matches(`${dir}/`);
  }
}
